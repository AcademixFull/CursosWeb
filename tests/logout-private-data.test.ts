import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { offlineStore } from "../src/offline/store";

describe("explicit private download cleanup", () => {
  it("rejects late writes even after the same account logs in again", async () => {
    await offlineStore.clearUser("logout-test");
    const revision = offlineStore.generation("logout-test");
    await offlineStore.put("logout-test", "library", "enrollments", ["private"], revision);
    await offlineStore.revokeUser("logout-test");
    offlineStore.resumeUser("logout-test");
    await offlineStore.put("logout-test", "library", "enrollments", ["late-private"], revision);
    expect(await offlineStore.get("logout-test", "library", "enrollments")).toBeUndefined();
    await offlineStore.put("logout-test", "library", "enrollments", ["new-session"], offlineStore.generation("logout-test"));
    expect(await offlineStore.get("logout-test", "library", "enrollments")).toEqual(["new-session"]);
    await offlineStore.clearUser("logout-test");
  });
});
