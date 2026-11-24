import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../src/components/auth/FormField";

function PasswordForm({ onSubmit = () => {} }: { onSubmit?: () => void }) {
  const [password, setPassword] = useState("");
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <FormField label="Contraseña" type="password" autoComplete="current-password"
        value={password} onChange={(event) => setPassword(event.target.value)} />
      <output aria-label="Longitud">{password.length}</output>
      <button type="button" onClick={() => setPassword("")}>Limpiar</button>
      <button type="submit">Entrar</button>
    </form>
  );
}

describe("password privacy and visibility", () => {
  it("masks by default and keeps the password out of the HTML value attribute", async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);
    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    await user.type(input, "secret-123");
    expect(input).toHaveValue("secret-123");
    expect(input).not.toHaveAttribute("value");
    expect(screen.getByLabelText("Longitud")).toHaveTextContent("10");
  });

  it("toggles visibility with an accessible keyboard button without submitting", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(<PasswordForm onSubmit={submitted} />);
    const input = screen.getByLabelText("Contraseña");
    await user.type(input, "secret-123");
    await user.tab();
    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.keyboard("{Enter}");
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAccessibleName("Ocultar contraseña");
    expect(submitted).not.toHaveBeenCalled();
    await user.keyboard(" ");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("secret-123");
    expect(submitted).not.toHaveBeenCalled();
  });

  it("hides when focus leaves the control and respects external clearing", async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);
    const input = screen.getByLabelText("Contraseña");
    await user.type(input, "secret-123");
    await user.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "Ocultar contraseña" }) });
    expect(input).toHaveAttribute("type", "text");
    await user.tab();
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(input).toHaveValue("");
    expect(screen.getByLabelText("Longitud")).toHaveTextContent("0");
  });
});
