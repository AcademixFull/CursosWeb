import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartPage from "../src/pages/CartPage";
import { CartProvider } from "../src/contexts/CartProvider";
import { useCart } from "../src/hooks/useCart";
import type { CourseSummary } from "../src/types/course.types";

const state = vi.hoisted(() => ({ user: { id: "account-a" }, checkout: vi.fn() }));
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => ({ user: state.user, isAuthenticated: true }) }));
vi.mock("../src/hooks/useStudent", () => ({
  studentQueryKeys: { courses: (id: string) => ["student", id, "courses"] },
  useCourseOwnership: () => ({ data: [], isSuccess: true }),
  useMyCourses: () => ({ data: [], isSuccess: true }),
}));
vi.mock("../src/services/checkout.service", () => ({ simulatedCheckout: state.checkout }));

const item = { id: "course-paid", title: "Curso comprado", instructorName: "Ana", price: 10 };
const enrollment = { id: "enrollment", course: { id: item.id, title: item.title }, status: "in_progress" };
const receipt = { id: "receipt", mode: "simulated", currency: "MXN", total: 150, items: [{ courseId: item.id, amount: 150, alreadyOwned: false }], enrollments: [enrollment] };
function AddAnotherCourse() {
  const cart = useCart();
  return <button onClick={() => cart.addCourse({id:"course-later",title:"Curso agregado después",price:20,instructor:{name:"Ana"}} as CourseSummary)}>Agregar otro curso</button>;
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><MemoryRouter><CartProvider><AddAnotherCourse /><CartPage /></CartProvider></MemoryRouter></QueryClientProvider>);
  return { client, ...view };
}
describe("confirmación de compra simulada", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("academix:cart:account-a", JSON.stringify([item]));
    state.user = { id: "account-a" };
    state.checkout.mockReset();
  });
  it("confirma, actualiza la biblioteca de la cuenta, vacía el carrito y abre el material", async () => {
    state.checkout.mockResolvedValue(receipt);
    const { client } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra simulada" }));
    await screen.findByText(/Compra simulada confirmada/);
    expect(screen.getByRole("link", { name: "Ver material de Curso comprado" })).toHaveAttribute("href", expect.stringContaining(item.id));
    expect(client.getQueryData(["student", "account-a", "courses"])).toEqual([enrollment]);
    await waitFor(() => expect(localStorage.getItem("academix:cart:account-a")).toBe("[]"));
    expect(state.checkout).toHaveBeenCalledWith({ courseIds: [item.id], idempotencyKey: expect.any(String) });
    expect(screen.queryByText(/pasarela|fase posterior|falta conectar/i)).not.toBeInTheDocument();
  });
  it("conserva el carrito y la misma clave al reintentar una respuesta perdida", async () => {
    state.checkout.mockRejectedValueOnce(new Error("No se pudo confirmar la compra.")).mockResolvedValueOnce(receipt);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra simulada" }));
    await screen.findByRole("alert");
    expect(localStorage.getItem("academix:cart:account-a")).toContain(item.id);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra simulada" }));
    await screen.findByText(/Compra simulada confirmada/);
    expect(state.checkout.mock.calls[0]?.[0]).toEqual(state.checkout.mock.calls[1]?.[0]);
  });
  it("conserva los cursos añadidos mientras otra compra está en proceso", async () => {
    let complete!: (value: typeof receipt) => void;
    state.checkout.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra simulada" }));
    await screen.findByRole("button", { name: "Confirmando compra..." });
    fireEvent.click(screen.getByRole("button", { name: "Agregar otro curso" }));
    expect(screen.getByText("Curso agregado después")).toBeInTheDocument();
    await act(async () => { complete(receipt); });
    expect(screen.getByText("Curso agregado después")).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("academix:cart:account-a")!)).toEqual([expect.objectContaining({id:"course-later"})]));
  });
  it("no vacía el carrito de otra cuenta si cambia la sesión durante la confirmación", async () => {
    let complete!: (value: typeof receipt) => void;
    state.checkout.mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    const { client, rerender } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra simulada" }));
    expect(await screen.findByRole("button", { name: "Confirmando compra..." })).toBeDisabled();
    const otherItem = { ...item, id: "course-other", title: "Curso de otra cuenta" };
    localStorage.setItem("academix:cart:account-b", JSON.stringify([otherItem]));
    state.user = { id: "account-b" };
    rerender(<QueryClientProvider client={client}><MemoryRouter><CartProvider><CartPage /></CartProvider></MemoryRouter></QueryClientProvider>);
    await act(async () => { complete(receipt); });
    expect(screen.getByText(otherItem.title)).toBeInTheDocument();
    expect(localStorage.getItem("academix:cart:account-b")).toContain(otherItem.id);
    expect(client.getQueryData(["student", "account-a", "courses"])).toEqual([enrollment]);
    expect(client.getQueryData(["student", "account-b", "courses"])).toBeUndefined();
  });
});
