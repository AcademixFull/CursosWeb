import "fake-indexeddb/auto";
import { useEffect } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../src/contexts/AuthProvider";
import { useAuth } from "../src/hooks/useAuth";
import { createQueryClient } from "../src/utils/queryClient";
import { offlineStore } from "../src/offline/store";
import { clearAuthSession, getAuthToken, readAuthSession, saveAuthSession } from "../src/utils/authSessionStore";
import type { AuthContextValue } from "../src/contexts/auth-context";

const service = vi.hoisted(() => ({ logout: vi.fn(), getCurrentUser: vi.fn(), login: vi.fn() }));
vi.mock("../src/services/auth.service", () => ({ authService: service }));
const user = { id: "privacy-alice", fullName: "Alice", email: "alice@test.com", role: "student" as const };
const session = () => ({ user, accessToken: "test-session", expiresAt: new Date(Date.now() + 60_000).toISOString() });
let auth: AuthContextValue;
function Observe() {
  const value = useAuth();
  useEffect(() => { auth = value; }, [value]);
  return <output>{value.user?.id ?? "signed-out"}</output>;
}
function mount() {
  const client = createQueryClient();
  render(<QueryClientProvider client={client}><AuthProvider><Observe /></AuthProvider></QueryClientProvider>);
  return client;
}

describe("authentication privacy boundary", () => {
  beforeEach(async () => {
    clearAuthSession(); service.logout.mockResolvedValue(undefined); service.login.mockResolvedValue(session());
    service.getCurrentUser.mockResolvedValue(user); offlineStore.resumeUser(user.id); await offlineStore.clearUser(user.id);
    saveAuthSession(session());
  });
  it("clears private cached responses and all downloads on explicit logout", async () => {
    const client = mount();
    await waitFor(() => expect(auth.isInitializing).toBe(false));
    for (const key of ["organizations", "notifications", "subscriptions", "student", "learning"]) client.setQueryData([key, user.id], ["private"]);
    client.setQueryData(["courses", "featured"], ["public"]);
    await offlineStore.put(user.id, "library", "enrollments", ["private"]);
    await offlineStore.put(user.id, "pending", "lesson", { private: true });
    await act(() => auth.logout());
    expect(auth.user).toBeNull(); expect(getAuthToken()).toBeUndefined(); expect(readAuthSession()).toBeNull();
    expect(await offlineStore.list(user.id, "library")).toEqual([]);
    expect(await offlineStore.list(user.id, "pending")).toEqual([]);
    expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([["courses", "featured"]]);
    client.clear();
  });
  it("does not restore a logged-out account from late startup validation", async () => {
    let finish!: (value: typeof user) => void;
    service.getCurrentUser.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const client = mount();
    await act(() => auth.logout());
    await act(async () => { finish(user); await Promise.resolve(); });
    expect(auth.user).toBeNull(); expect(readAuthSession()).toBeNull();
    client.clear();
  });
  it("does not restore an older login when logout happens during account-switch cleanup", async () => {
    const client = mount();
    await waitFor(() => expect(auth.isInitializing).toBe(false));
    let release!: () => void;
    const cleanup = vi.spyOn(offlineStore, "revokeUser").mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve; }));
    const other = { ...session(), user: { ...user, id: "privacy-bob" } };
    service.login.mockResolvedValueOnce(other);
    let login!: Promise<unknown>;
    await act(async () => { login = auth.login({ email: "bob@test.com", password: "test-password" }).catch((error: unknown) => error); await Promise.resolve(); });
    await waitFor(() => expect(cleanup).toHaveBeenCalledWith(user.id));
    await act(() => auth.logout());
    await act(async () => { release(); await login; });
    expect(auth.user).toBeNull(); expect(readAuthSession()).toBeNull();
    cleanup.mockRestore(); client.clear();
  });

});
