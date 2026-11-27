import { useOnline } from "../../hooks/useOnline";
import { ApiError } from "../../services/api";
import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { usePlans, usePurchasePlan, useSubscriptions, useSubscriptionTransactions } from "../../hooks/useSubscriptions";
import { ROUTES } from "../../config/routes";
import { userErrorMessage } from "../../services/api";
import { formatMxn } from "../../utils/currency";
import type { SubscriptionPlan } from "../../types/subscription.types";
import { Button } from "../ui/Button";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { Pagination } from "../ui/Pagination";

export function PlanPurchaseButton({ plan, organizationId }: { plan: SubscriptionPlan; organizationId?: string }) {
  const { user } = useAuth();
  const mutation = usePurchasePlan();
  const online = useOnline();
  const [confirmedPlan, setConfirmedPlan] = useState<SubscriptionPlan | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  if (plan.purchasable && !online && !key) return <p className="font-semibold text-slate-300">Conéctate a internet para suscribirte.</p>;
  if (!user) return <Link className="font-semibold text-brand-300 underline" to={ROUTES.login}>Inicia sesión para comprar</Link>;
  if (!plan.purchasable) return <Link className="font-semibold text-brand-300 underline" to={ROUTES.contact}>Contactar a Academix</Link>;
  if (plan.audience === "organization" && !organizationId) return <Link className="font-semibold text-brand-300 underline" to={ROUTES.organization}>Elegir o crear organización</Link>;
  async function confirm() {
    if (!key || !confirmedPlan || !navigator.onLine) return;
    const storageKey = `academix:plan-purchase:${user!.id}:${plan.id}:${organizationId ?? "personal"}`;
    sessionStorage.setItem(storageKey, key);
    try {
      const result = await mutation.mutateAsync({ plan: confirmedPlan, organizationId, idempotencyKey: key });
      setSuccess(`Compra simulada registrada. Vigencia hasta ${new Date(result.subscription.endsAt).toLocaleString("es-MX")}.`);
      setKey(null);
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLAN_CHANGED") setKey(null);
    }
  }
  const displayPlan = confirmedPlan ?? plan;
  return <div><Button disabled={!online} onClick={() => {
    setConfirmedPlan(plan);
    setKey(sessionStorage.getItem(`academix:plan-purchase:${user.id}:${plan.id}:${organizationId ?? "personal"}`) ?? crypto.randomUUID());
    mutation.reset();
    setSuccess("");
  }}>Comprar plan (simulado)</Button>
    {success ? <p role="status" className="mt-3 text-sm text-emerald-300">{success}</p> : null}
    {!key && mutation.error ? <p role="alert" className="mt-3 text-sm text-red-300">{userErrorMessage(mutation.error)}</p> : null}
    <ConfirmationDialog open={Boolean(key)} title={`Confirmar ${displayPlan.name}`} pending={mutation.isPending} confirmDisabled={!online} onCancel={() => setKey(null)} onConfirm={() => void confirm()} confirmLabel="Confirmar compra simulada">
      {!online ? <p role="status">Conéctate a internet para confirmar la suscripción.</p> : null}
      <p>{formatMxn(displayPlan.priceMxn ?? 0)} por {displayPlan.months} {displayPlan.months === 1 ? "mes" : "meses"}. No se realizará ningún cobro real.</p>
      <p>El plan habilita sus beneficios durante la vigencia. Una renovación amplía el periodo vigente.</p>
      <ul className="list-disc pl-5">{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
      {mutation.error ? <p role="alert" className="text-red-300">{userErrorMessage(mutation.error)}</p> : null}
    </ConfirmationDialog>
  </div>;
}

export function SubscriptionPanel({ organizationId, canPurchase = true }: { organizationId?: string; canPurchase?: boolean }) {
  const plans = usePlans();
  const [page, setPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const subscriptions = useSubscriptions(page);
  const transactions = useSubscriptionTransactions(transactionPage);
  return <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6" aria-label="Planes y suscripciones">
    <h2 className="text-xl font-bold text-slate-100">{organizationId ? "Plan institucional" : "Mis planes y suscripciones"}</h2>
    {!organizationId && subscriptions.isPending ? <p role="status" className="mt-4 text-sm text-slate-400">Consultando suscripciones…</p> : null}
    {!organizationId && subscriptions.error ? <p role="alert" className="mt-4 text-sm text-red-300">{userErrorMessage(subscriptions.error)}</p> : null}
    {!organizationId ? <div className="mt-4 space-y-3">{subscriptions.data?.items.map((subscription) => <article key={subscription.id} className="rounded-xl bg-white/5 p-4 text-sm text-slate-300">
      <p className="font-semibold text-white">{subscription.planName}{subscription.organizationId ? " · Organización" : " · Personal"}</p>
      <p>{subscription.status === "active" ? "Vigente" : subscription.status === "expired" ? "Vencido" : "Cancelado"}</p>
      <p>Activación: {new Date(subscription.startsAt).toLocaleString("es-MX")}</p><p>Vencimiento: {new Date(subscription.endsAt).toLocaleString("es-MX")}</p>
    </article>)}{subscriptions.data?.items.length === 0 ? <p className="text-sm text-slate-400">Todavía no tienes una suscripción.</p> : null}</div> : null}
    {!organizationId && subscriptions.data ? <Pagination label="Suscripciones" pagination={subscriptions.data.pagination} isPending={subscriptions.isFetching} onPageChange={setPage} /> : null}
    {canPurchase ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{plans.data?.filter((plan) => plan.purchasable && plan.audience === (organizationId ? "organization" : "person")).map((plan) => <article key={plan.id} className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold text-slate-100">{plan.name}</h3><p className="mb-4 mt-2 text-sm text-slate-400">{formatMxn(plan.priceMxn ?? 0)} · {plan.months} {plan.months === 1 ? "mes" : "meses"}</p><PlanPurchaseButton plan={plan} organizationId={organizationId} /></article>)}</div> : null}
    {plans.error ? <p role="alert" className="mt-4 text-sm text-red-300">{userErrorMessage(plans.error)}</p> : null}
    {!organizationId ? <div className="mt-6"><h3 className="font-semibold text-slate-100">Historial de compras simuladas</h3>
      {transactions.isPending ? <p role="status" className="mt-3 text-sm text-slate-400">Consultando compras…</p> : null}
      {transactions.error ? <p role="alert" className="mt-3 text-sm text-red-300">{userErrorMessage(transactions.error)}</p> : null}
      <ul className="mt-3 space-y-3">{transactions.data?.items.map((receipt) => <li key={receipt.id} className="rounded-lg bg-white/5 p-3 text-sm text-slate-300"><p>{receipt.subscription.planName} · {formatMxn(receipt.amount)}</p><p>{new Date(receipt.createdAt).toLocaleString("es-MX")} · Simulada</p></li>)}</ul>
      {transactions.data?.items.length === 0 ? <p className="mt-3 text-sm text-slate-400">No hay compras registradas.</p> : null}
      {transactions.data ? <Pagination label="Compras de planes" pagination={transactions.data.pagination} isPending={transactions.isFetching} onPageChange={setTransactionPage} /> : null}
    </div> : null}
  </section>;
}
