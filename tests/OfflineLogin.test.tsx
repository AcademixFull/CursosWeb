import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthContextValue } from "../src/contexts/auth-context";
import LoginPage from "../src/pages/auth/LoginPage";

describe("offline-only reauthentication", () => {
  it("opens the login form for a restored offline profile", () => {
    const context = { isAuthenticated: true, isInitializing: false,
      session: { user: {id:"alice",email:"alice@test.com",fullName:"Alice",role:"student"},accessToken:"",expiresAt:new Date(0).toISOString() },
      login: vi.fn() } as unknown as AuthContextValue;
    render(<AuthContext.Provider value={context}><MemoryRouter><LoginPage /></MemoryRouter></AuthContext.Provider>);
    expect(screen.getByRole("button", {name:"Entrar"})).toBeInTheDocument();
  });
});
