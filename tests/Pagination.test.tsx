import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../src/components/ui/Pagination";

describe("shared server list pagination", () => {
  it("keeps an empty out-of-range page recoverable after a deletion", () => {
    const change = vi.fn();
    render(<Pagination pagination={{ page: 3, limit: 20, total: 0 }} onPageChange={change} />);
    expect(screen.getByText(/0 resultados/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Primera" }));
    expect(change).toHaveBeenCalledWith(1);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
  it("uses server totals and disables navigation while loading", () => {
    render(<Pagination pagination={{ page: 2, limit: 10, total: 95 }} onPageChange={vi.fn()} isPending />);
    expect(screen.getByText(/Página 2 de 10/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
