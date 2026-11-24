import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "../src/contexts/CartProvider";
import { courseMocks } from "../src/data/courseMocks";
import { useCart } from "../src/hooks/useCart";

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  user: { id: "user-1" },
}));

const ownedCourseId = courseMocks[0]?.id;
if (!ownedCourseId) throw new Error("El catálogo mock no contiene cursos.");
const completedCourseId = courseMocks[1]?.id;

vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../src/hooks/useStudent", () => ({
  useCourseOwnership: () => ({ data: [ownedCourseId, completedCourseId], isSuccess: true }),
  useMyCourses: () => ({
    isSuccess: true,
    data: [
      { course: { id: ownedCourseId }, status: "in_progress" },
      { course: { id: completedCourseId }, status: "completed" },
      { course: { id: "expired-plus-course" }, status: "completed", accessActive: false },
    ],
  }),
}));

function Probe() {
  const cart = useCart();
  const ownedCourse = courseMocks[0];
  if (!ownedCourse) return null;

  return (
    <div>
      <span data-testid="count">{cart.count}</span>
      <span data-testid="titles">{cart.items.map((item) => item.title).join(",")}</span>
      <button type="button" onClick={() => cart.addCourse(ownedCourse)}>Agregar poseído</button>
      <button type="button" onClick={() => courseMocks[1] && cart.addCourse(courseMocks[1])}>Agregar completado</button>
    </div>
  );
}

describe("CartProvider ownership", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("academix:cart:user-1", JSON.stringify([
      { id: ownedCourseId, title: "Curso ya adquirido", price: 50, instructorName: "Antony" },
      { id: completedCourseId, title: "Curso completado", price: 100, instructorName: "Ana" },
      { id: "course-available", title: "Curso disponible", price: 80, instructorName: "Marco" },
    ]));
  });

  it("oculta y elimina del carrito los cursos que el usuario ya posee", async () => {
    render(<CartProvider><Probe /></CartProvider>);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("titles")).toHaveTextContent("Curso disponible");
    expect(screen.getByTestId("titles")).not.toHaveTextContent("Curso ya adquirido");

    fireEvent.click(screen.getByRole("button", { name: "Agregar poseído" }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar completado" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await waitFor(() => {
      const stored = localStorage.getItem("academix:cart:user-1") ?? "";
      expect(stored).not.toContain(ownedCourseId);
      expect(stored).not.toContain(completedCourseId);
      expect(stored).toContain("course-available");
    });
  });
  it("keeps an expired Plus course available for individual purchase", () => {
    localStorage.setItem("academix:cart:user-1", JSON.stringify([{ id: "expired-plus-course", title: "Plus vencido", price: 80, instructorName: "Ana" }]));
    render(<CartProvider><Probe /></CartProvider>);
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

});
