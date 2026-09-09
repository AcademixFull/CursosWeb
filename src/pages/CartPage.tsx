import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../config/routes";
import { useCart } from "../hooks/useCart";
import { formatMxn } from "../utils/currency";

export default function CartPage() {
  const cart = useCart();
  const [message, setMessage] = useState("");

  return (
    <section aria-labelledby="cart-title" className="min-w-0">
      <p className="text-sm font-semibold text-brand-300">Compra de cursos</p>
      <h1 id="cart-title" className="mt-2 break-words text-3xl font-bold">Mi carrito</h1>
      <p className="mt-2 text-slate-400">Revisa tus cursos antes de continuar al pago.</p>

      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-3">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold">{item.title}</h2>
                <p className="mt-1 break-words text-sm text-slate-400">Por {item.instructorName}</p>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-4 sm:block sm:text-right">
                <strong className="text-brand-300">{formatMxn(item.price)}</strong>
                <button
                  type="button"
                  onClick={() => cart.removeCourse(item.id)}
                  className="text-xs text-red-300 sm:mt-2 sm:block sm:w-full"
                >
                  Quitar
                </button>
              </div>
            </article>
          ))}

          {cart.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center sm:p-8">
              <p className="text-slate-400">Tu carrito está vacío.</p>
              <Link to={ROUTES.courses} className="mt-3 inline-block font-semibold text-brand-300">
                Explorar cursos
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="h-fit min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-5 xl:sticky xl:top-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Total</span>
            <strong className="text-xl text-brand-300">{formatMxn(cart.total)}</strong>
          </div>
          <Button
            className="mt-5 w-full"
            disabled={!cart.items.length}
            onClick={() =>
              setMessage(
                "Tu carrito está listo. Falta conectar la pasarela de pago para procesar el cobro de forma segura.",
              )
            }
          >
            Continuar a pago
          </Button>
          {message ? (
            <p role="status" className="mt-3 break-words text-xs leading-5 text-amber-200">
              {message}
            </p>
          ) : null}
          <p className="mt-4 break-words text-xs leading-5 text-slate-500">
            Academix no marcará cursos como pagados hasta recibir confirmación de una pasarela de pago.
          </p>
        </aside>
      </div>
    </section>
  );
}
