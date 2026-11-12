import type { ReactNode } from "react";

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sort?: string;
}
export function DataTable<T>({ caption, rows, columns, rowKey, sort, direction, onSort }: {
  caption: string; rows: T[]; columns: TableColumn<T>[]; rowKey: (row: T) => string;
  sort?: string; direction?: "asc" | "desc"; onSort?: (field: string) => void;
}) {
  return <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="border-b border-white/10 bg-slate-950/40 text-slate-300">
        <tr>{columns.map((column) => <th key={column.key} scope="col" className="px-4 py-4 font-semibold"
          aria-sort={column.sort && column.sort === sort ? direction === "desc" ? "descending" : "ascending" : undefined}>
          {column.sort && onSort ? <button className="rounded px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-brand-400" onClick={() => onSort(column.sort!)}>
            {column.label} {sort === column.sort ? direction === "desc" ? "↓" : "↑" : "↕"}
          </button> : column.label}
        </th>)}</tr>
      </thead>
      <tbody className="divide-y divide-white/10">{rows.map((row) => <tr key={rowKey(row)} className="align-top hover:bg-brand-500/5">
        {columns.map((column) => <td key={column.key} className="px-4 py-4">{column.render(row)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
