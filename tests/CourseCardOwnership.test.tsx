import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CourseCard from "../src/components/courses/CourseCard";
import { courseMocks } from "../src/data/courseMocks";

const authState = vi.hoisted(() => ({ isAuthenticated: true }));
const cartState = vi.hoisted(() => ({
  ownershipReady: true,
  ownsCourse: vi.fn(() => false),
  hasCourse: vi.fn(() => false),
  addCourse: vi.fn(),
}));

vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../src/hooks/useCart", () => ({ useCart: () => cartState }));

const course = courseMocks[0];
if (!course) throw new Error("El catálogo mock no contiene cursos.");

describe("CourseCard ownership", () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    cartState.ownershipReady = true;
    cartState.ownsCourse.mockReset();
    cartState.ownsCourse.mockReturnValue(false);
    cartState.hasCourse.mockReset();
    cartState.hasCourse.mockReturnValue(false);
    cartState.addCourse.mockReset();
  });

  it("no permite agregar al carrito un curso que el usuario ya tiene", () => {
    cartState.ownsCourse.mockReturnValue(true);
    render(<MemoryRouter><CourseCard course={course} /></MemoryRouter>);

    expect(screen.getByRole("button", { name: "Ya lo tienes" })).toBeDisabled();
    expect(cartState.addCourse).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ver material" })).toHaveAttribute("href", expect.stringContaining(course.id));
  });

  it("mantiene bloqueado un curso que ya está en el carrito", () => {
    cartState.hasCourse.mockReturnValue(true);
    render(<MemoryRouter><CourseCard course={course} /></MemoryRouter>);

    expect(screen.getByRole("button", { name: "En carrito" })).toBeDisabled();
  });

  it("identifica también el material gratuito que el usuario ya tiene", () => {
    cartState.ownsCourse.mockReturnValue(true);
    render(<MemoryRouter><CourseCard course={{ ...course, price: 0 }} /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Ya lo tienes" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Ver material" })).toBeInTheDocument();
  });

  it("espera a verificar los cursos del usuario antes de habilitar la compra", () => {
    cartState.ownershipReady = false;
    render(<MemoryRouter><CourseCard course={course} /></MemoryRouter>);

    expect(screen.getByRole("button", { name: "Consultando..." })).toBeDisabled();
  });
});
