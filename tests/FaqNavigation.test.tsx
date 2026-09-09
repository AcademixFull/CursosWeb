import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FaqPage from "../src/pages/FaqPage";

vi.mock("../src/layouts/PublicLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("FAQ navigation", () => {
  it("scrolls to a FAQ section without replacing the HashRouter route", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/#/preguntas");
    render(<FaqPage />);

    const section = document.getElementById("cuenta-y-acceso");
    expect(section).not.toBeNull();
    const scrollIntoView = vi.fn();
    Object.defineProperty(section, "scrollIntoView", { value: scrollIntoView });

    await user.click(screen.getByRole("button", { name: "Cuenta y acceso" }));

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "smooth" });
    expect(window.location.hash).toBe("#/preguntas");
  });
});
