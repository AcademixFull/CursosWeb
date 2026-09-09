export function formatMxn(value: number): string {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value)} MXN`;
}
