import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DataTable } from "../src/components/ui/DataTable";
it("exposes column order and asks the server consumer to sort", () => {
  const onSort = vi.fn();
  render(<DataTable caption="Miembros" rows={[{ id: "1", name: "Ana" }]} rowKey={(row) => row.id}
    sort="name" direction="asc" onSort={onSort}
    columns={[{ key: "name", label: "Nombre", sort: "name", render: (row) => row.name }]} />);
  expect(screen.getByRole("table", { name: "Miembros" })).toBeInTheDocument();
  expect(screen.getByRole("columnheader")).toHaveAttribute("aria-sort", "ascending");
  fireEvent.click(screen.getByRole("button", { name: /Nombre/ }));
  expect(onSort).toHaveBeenCalledWith("name");
});
