import { useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { learningRoute, ROUTES } from "../config/routes";
import { useCart } from "../hooks/useCart";
import { formatMxn } from "../utils/currency";
import { useAuth } from "../hooks/useAuth";
import { useSimulatedCheckout } from "../hooks/useCheckout";
import { userErrorMessage } from "../services/api";
import type { CheckoutResult } from "../services/checkout.service";

export default function CartPage() {
  const { user } = useAuth();
  return <AccountCart key={user?.id ?? "guest"} />;
}

function AccountCart() {
  const cart = useCart();
  const checkout = useSimulatedCheckout();
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const submitting = useRef(false);
  const [receipt, setReceipt] = useState<CheckoutResult | null>(null);

  async function confirmPurchase() {
    if (submitting.current || !cart.ownershipReady || !cart.items.length) return;
    const courseIds = cart.items.map((item) => item.id).sort();
    const signature = JSON.stringify(courseIds);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
    submitting.current = true;
    try {
      const result = await checkout.mutateAsync({ courseIds, idempotencyKey: attempt.current.key });
      setReceipt(result.receipt);
      // A user can add another course elsewhere while this request is pending.
      // Remove only the submitted items, preserving later additions.
      for (const courseId of courseIds) cart.removeCourse(courseId);
    } catch {
      // Keep both the cart and the request key for a safe retry.
    } finally {
      submitting.current = false;
    }
  }

  return (
    <section aria-labelledby="cart-title" className="min-w-0">
      <p className="text-sm font-semibold text-brand-300">Compra de cursos</p>
      <h1 id="cart-title" className="mt-2 break-words text-3xl font-bold">Mi carrito</h1>
      <p className="mt-2 text-slate-400">Confirma tu compra simulada para acceder al material. No se realiza ningún cobro.</p>
      {receipt ? (
        <div role="status" className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-emerald-100">
          <p>Compra simulada confirmada. Tus cursos ya están disponibles.</p>
          <p className="mt-2 text-sm">Total simulado: {formatMxn(receipt.total)}</p>
          <ul className="mt-3 space-y-2">
            {receipt.enrollments.map((enrollment) => <li key={enrollment.id}><Link className="font-semibold underline" to={learningRoute(enrollment.course.id)}>Ver material de {enrollment.course.title}</Link></li>)}
          </ul>
        </div>
      ) : null}

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
                  disabled={checkout.isPending}
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
            <span>Total estimado</span>
            <strong className="text-xl text-brand-300">{formatMxn(cart.total)}</strong>
          </div>
          <Button
            className="mt-5 w-full"
            disabled={!cart.items.length || !cart.ownershipReady || checkout.isPending}
            onClick={() => void confirmPurchase()}
          >
            {checkout.isPending ? "Confirmando compra..." : "Confirmar compra simulada"}
          </Button>
          {checkout.isError ? (
            <p role="alert" className="mt-3 break-words text-xs leading-5 text-amber-200">
              {userErrorMessage(checkout.error, "No se pudo confirmar la compra. Revisa tus cursos e intenta nuevamente.")}
            </p>
          ) : null}
          <p className="mt-4 break-words text-xs leading-5 text-slate-500">
            La confirmación verifica el precio vigente y excluye los cursos que ya tienes. No necesitas datos bancarios.
          </p>
        </aside>
      </div>
    </section>
  );
}
