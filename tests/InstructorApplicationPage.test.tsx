import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InstructorApplicationPage from "../src/pages/InstructorApplicationPage";

const authState = vi.hoisted(() => ({
  user: null as null | { id: string; fullName: string; email: string; role: "student" | "instructor" | "moderator" | "admin" },
  refreshUser: vi.fn(),
}));

vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../src/services/management.service", () => ({
  managementService: {
    getMyInstructorApplication: vi.fn(),
    submitInstructorApplication: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <InstructorApplicationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InstructorApplicationPage", () => {
  beforeEach(() => {
    authState.user = null;
    authState.refreshUser.mockReset();
  });

  it("avisa al instructor externo que su acceso ya está activo", () => {
    authState.user = { id: "i1", fullName: "Antony", email: "antony@example.com", role: "instructor" };
    renderPage();

    expect(screen.getByRole("heading", { name: "Ya eres instructor de Academix" })).toBeInTheDocument();
    expect(screen.getByText(/No necesitas enviar otra solicitud/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir a mi panel de instructor" })).toBeInTheDocument();
  });

  it("explica al moderador que su rol es de revisión y no envía solicitud de instructor", () => {
    authState.user = { id: "m1", fullName: "Ana Moderadora", email: "moderador@example.com", role: "moderator" };
    renderPage();

    expect(screen.getByRole("heading", { name: "Tu cuenta tiene acceso de moderación" })).toBeInTheDocument();
    expect(screen.getByText(/no puede publicar cursos con esos permisos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver a moderación" })).toBeInTheDocument();
  });

  it("evita que un administrador envíe una solicitud de instructor", () => {
    authState.user = { id: "a1", fullName: "Marco Admin", email: "admin@example.com", role: "admin" };
    renderPage();

    expect(screen.getByRole("heading", { name: "Tu cuenta ya tiene acceso administrativo" })).toBeInTheDocument();
    expect(screen.getByText(/no necesitas enviar una solicitud para enseñar/i)).toBeInTheDocument();
  });
});
