import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useCart } from "../hooks/useCart";
const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(value);
export default function CartPage() {
  const cart = useCart(); const [message, setMessage] = useState("");
  return <section aria-labelledby="cart-title"><p className="text-sm font-semibold text-brand-300">Compra de cursos</p><h1 id="cart-title" className="mt-2 text-3xl font-bold">Mi carrito</h1><p className="mt-2 text-slate-400">Revisa tus cursos antes de continuar al pago.</p>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]"><div className="space-y-3">{cart.items.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-400">Por {item.instructorName}</p></div><div className="text-right"><strong className="text-brand-300">{money(item.price)}</strong><button type="button" onClick={() => cart.removeCourse(item.id)} className="mt-2 block text-xs text-red-300">Quitar</button></div></article>)}{cart.items.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><p className="text-slate-400">Tu carrito está vacío.</p><Link to={ROUTES.courses} className="mt-3 inline-block font-semibold text-brand-300">Explorar cursos</Link></div> : null}</div>
      <aside className="h-fit rounded-2xl border border-white/10 bg-slate-900/70 p-5"><div className="flex justify-between"><span>Total</span><strong className="text-xl text-brand-300">{money(cart.total)}</strong></div><Button className="mt-5 w-full" disabled={!cart.items.length} onClick={() => setMessage("Tu carrito está listo. Falta conectar la pasarela de pago para procesar el cobro de forma segura.")}>Continuar a pago</Button>{message ? <p role="status" className="mt-3 text-xs leading-5 text-amber-200">{message}</p> : null}<p className="mt-4 text-xs leading-5 text-slate-500">Academix no marcará cursos como pagados hasta recibir confirmación de una pasarela de pago.</p></aside></div>
  </section>;
}
