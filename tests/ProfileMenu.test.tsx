import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "../src/components/navigation/ProfileMenu";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as null | { id: string; fullName: string; email: string; role: "student" | "instructor" | "moderator" | "admin" },
  logout: vi.fn(async () => undefined),
}));

vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../src/hooks/useTheme", () => ({ useTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }) }));
vi.mock("../src/hooks/useCart", () => ({ useCart: () => ({ count: 2 }) }));

function renderMenu() {
  return render(<MemoryRouter><ProfileMenu /></MemoryRouter>);
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.logout.mockClear();
  });

  it("muestra acceso e información pública a visitantes desde el menú de perfil", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de cuenta" }));

    expect(screen.getByRole("menuitem", { name: "Entrar" })).toHaveAttribute("href", "/iniciar-sesion");
    expect(screen.getByRole("menuitem", { name: "Registrarse" })).toHaveAttribute("href", "/registro");
    expect(screen.getByRole("menuitem", { name: "Nosotros" })).toHaveAttribute("href", "/nosotros");
    expect(screen.getByRole("menuitem", { name: "Preguntas" })).toHaveAttribute("href", "/preguntas");
    expect(screen.getByRole("menuitem", { name: "Contacto" })).toHaveAttribute("href", "/contacto");
  });

  it("muestra los módulos del estudiante autenticado dentro del desplegable", () => {
    authState.isAuthenticated = true;
    authState.user = { id: "u1", fullName: "Marco Antonio", email: "marco@example.com", role: "student" };
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de Marco Antonio" }));

    expect(screen.getByText("Marco Antonio")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mi aprendizaje" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("menuitem", { name: "Mi información" })).toHaveAttribute("href", "/perfil");
    expect(screen.getByRole("menuitem", { name: "Mis cursos" })).toHaveAttribute("href", "/mis-cursos");
    expect(screen.getByRole("menuitem", { name: "Carrito (2)" })).toHaveAttribute("href", "/carrito");
    expect(screen.getByRole("menuitem", { name: "Quiero enseñar" })).toHaveAttribute("href", "/solicitud-instructor");
  });

  it("muestra al instructor sus funciones de aprendizaje además del panel de enseñanza", () => {
    authState.isAuthenticated = true;
    authState.user = { id: "u2", fullName: "Antony", email: "antony@example.com", role: "instructor" };
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de Antony" }));

    expect(screen.getByRole("menuitem", { name: "Panel de instructor" })).toHaveAttribute("href", "/panel-instructor");
    expect(screen.getByRole("menuitem", { name: "Mi aprendizaje" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("menuitem", { name: "Mis cursos" })).toHaveAttribute("href", "/mis-cursos");
    expect(screen.getByRole("menuitem", { name: "Certificados" })).toHaveAttribute("href", "/certificados");
    expect(screen.getByRole("menuitem", { name: "Carrito (2)" })).toHaveAttribute("href", "/carrito");
    expect(screen.getByRole("menuitem", { name: "Quiero enseñar" })).toHaveAttribute("href", "/solicitud-instructor");
  });

  it("muestra al administrador las funciones generales de Academix", () => {
    authState.isAuthenticated = true;
    authState.user = { id: "u3", fullName: "Marco Admin", email: "admin@example.com", role: "admin" };
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de Marco Admin" }));

    expect(screen.getByRole("menuitem", { name: "Administración" })).toHaveAttribute("href", "/administracion");
    expect(screen.getByRole("menuitem", { name: "Mi aprendizaje" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("menuitem", { name: "Mis cursos" })).toHaveAttribute("href", "/mis-cursos");
    expect(screen.getByRole("menuitem", { name: "Certificados" })).toHaveAttribute("href", "/certificados");
    expect(screen.getByRole("menuitem", { name: "Carrito (2)" })).toHaveAttribute("href", "/carrito");
    expect(screen.getByRole("menuitem", { name: "Quiero enseñar" })).toHaveAttribute("href", "/solicitud-instructor");
  });

  it("muestra al moderador su panel y conserva las funciones de aprendizaje", () => {
    authState.isAuthenticated = true;
    authState.user = { id: "u4", fullName: "Ana Moderadora", email: "moderador@example.com", role: "moderator" };
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú de Ana Moderadora" }));

    expect(screen.getByText("Moderador Academix")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Moderación" })).toHaveAttribute("href", "/moderacion");
    expect(screen.getByRole("menuitem", { name: "Mi aprendizaje" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("menuitem", { name: "Mis cursos" })).toHaveAttribute("href", "/mis-cursos");
    expect(screen.getByRole("menuitem", { name: "Certificados" })).toHaveAttribute("href", "/certificados");
    expect(screen.getByRole("menuitem", { name: "Carrito (2)" })).toHaveAttribute("href", "/carrito");
    expect(screen.queryByRole("menuitem", { name: "Quiero enseñar" })).not.toBeInTheDocument();
  });

});
