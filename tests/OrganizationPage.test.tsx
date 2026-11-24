import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrganizationPage from "../src/pages/OrganizationPage";
import type { OrganizationSummary } from "../src/types/organization.types";
const state = vi.hoisted(() => ({
  query: { isPending: false, isError: false, data: [] as OrganizationSummary[], error: null as unknown, refetch: vi.fn() },
  remove: vi.fn().mockResolvedValue({ deleted: true }),
}));
vi.mock("../src/hooks/useOrganizations", () => ({
  useOrganizations: () => state.query,
  useOrganizationWorkspace: () => ({
    members: { data: { items: [], pagination: { page: 1, limit: 20, total: 0 } }, isPending: false },
    courses: { data: { items: [], pagination: { page: 1, limit: 20, total: 0 } }, isPending: false },
    setRole: { mutate: vi.fn(), isPending: false }, assignInstructor: { mutate: vi.fn(), isPending: false },
    create: { mutateAsync: vi.fn(), isPending: false }, join: { mutateAsync: vi.fn(), isPending: false },
  }),
}));
vi.mock("../src/services/organization.service", () => ({ organizationService: { remove: state.remove } }));
vi.mock("../src/components/subscription/SubscriptionPanel", () => ({ SubscriptionPanel: () => <div>Plan institucional</div> }));
const org: OrganizationSummary = { id: "org", name: "Campus existente", slug: "campus", description: "", type: "university", role: "administrator", memberCount: 2, joinCode: "ABC123", createdAt: "2026-01-01", isOwner: true, active: true, subscription: { active: false, startsAt: null, endsAt: null }, capabilities: { canDelete: true, canManageMembers: true, canManageCourses: false, canLearn: false } };
function mount() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><OrganizationPage /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => {
  state.query.isPending=false; state.query.isError=false; state.query.error=null; state.query.data=[];
  HTMLDialogElement.prototype.showModal=function() { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close=function() { this.removeAttribute("open"); };
});
describe("organization discovery and deletion", () => {
  it("does not offer creation while existing organizations are loading", () => {
    state.query.isPending=true; mount();
    expect(screen.getByRole("status")).toHaveTextContent("Consultando tus organizaciones");
    expect(screen.queryByText("Crear una organización")).not.toBeInTheDocument();
  });
  it("shows a retryable error instead of pretending membership is empty", async () => {
    state.query.isError=true; state.query.error=new Error("Connection unavailable"); mount();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Crear una organización")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" })); expect(state.query.refetch).toHaveBeenCalled();
  });
  it("keeps an expired organization visible and separates ownership from payment", () => {
    state.query.data=[org]; mount();
    expect(screen.getByRole("heading", { name: "Campus existente" })).toBeInTheDocument();
    expect(screen.getByText(/Eres propietario/)).toHaveTextContent("Sin suscripción vigente");
    expect(screen.queryByRole("link", { name: "Gestionar cursos institucionales" })).not.toBeInTheDocument();
  });
  it("requires explicit confirmation and explains preservation before deleting", async () => {
    state.query.data=[org]; mount(); const user=userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Eliminar organización" }));
    expect(state.remove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent("Se conservarán las cuentas de los miembros, materiales, avances y certificados");
    await user.click(screen.getAllByRole("button", { name: "Eliminar organización" })[1]);
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith("org", expect.anything()));
  });
  it("does not expose deletion to an administrator who is not the owner", () => {
    state.query.data=[{ ...org, isOwner: false, capabilities: { ...org.capabilities!, canDelete: false } }]; mount();
    expect(screen.queryByRole("button", { name: "Eliminar organización" })).not.toBeInTheDocument();
  });
});
