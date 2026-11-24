import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AccountDeletionPanel } from "../src/components/account/AccountDeletionPanel";
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));
vi.mock("../src/services/api", () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }, userErrorMessage: () => "Operación rechazada" }));
import { api } from "../src/services/api";
beforeEach(() => { vi.clearAllMocks(); });
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AccountDeletionPanel /></QueryClientProvider>);
}
it("requires an explicit phrase and current password before sending deletion", async () => {
  vi.mocked(api.get).mockResolvedValue(null); vi.mocked(api.post).mockResolvedValue({ id: "r", status: "pending", deleteAfter: "2026-11-20T18:30:00Z" });
  mount(); fireEvent.click(await screen.findByRole("button", { name: "Eliminar mi cuenta" }));
  expect(screen.getByRole("button", { name: "Confirmar eliminación" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: "secret" } });
  fireEvent.change(screen.getByLabelText("Escribe ELIMINAR MI CUENTA"), { target: { value: "ELIMINAR MI CUENTA" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar eliminación" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/users/me/deletion", { password: "secret", confirmation: "ELIMINAR MI CUENTA" }));
});
it("shows the persisted deadline and sends cancellation to the server", async () => {
  vi.mocked(api.get).mockResolvedValue({ id: "r", status: "pending", deleteAfter: "2026-11-20T18:30:00Z" });
  vi.mocked(api.delete).mockResolvedValue({ cancelled: true }); mount();
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar eliminación" }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/users/me/deletion"));
});
