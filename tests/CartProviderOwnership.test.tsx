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

vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("../src/hooks/useStudent", () => ({
  useMyCourses: () => ({
    isSuccess: true,
    data: [{ course: { id: ownedCourseId } }],
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
    </div>
  );
}

describe("CartProvider ownership", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("academix:cart:user-1", JSON.stringify([
      { id: ownedCourseId, title: "Curso ya adquirido", price: 50, instructorName: "Antony" },
      { id: "course-available", title: "Curso disponible", price: 80, instructorName: "Marco" },
    ]));
  });

  it("oculta y elimina del carrito los cursos que el usuario ya posee", async () => {
    render(<CartProvider><Probe /></CartProvider>);

    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("titles")).toHaveTextContent("Curso disponible");
    expect(screen.getByTestId("titles")).not.toHaveTextContent("Curso ya adquirido");

    fireEvent.click(screen.getByRole("button", { name: "Agregar poseído" }));
    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await waitFor(() => {
      const stored = localStorage.getItem("academix:cart:user-1") ?? "";
      expect(stored).not.toContain(ownedCourseId);
      expect(stored).toContain("course-available");
    });
  });
});
