import { useState } from "react";
import { Link } from "react-router";
import PublicLayout from "../layouts/PublicLayout";
import { ROUTES } from "../config/routes";
import { ACADEMIX_SUBSCRIPTION_PLANS } from "../config/pricing";
import { formatMxn } from "../utils/currency";
const personPlans = [
  { name: "Academix Plus Mensual", eyebrow: "Acceso ilimitado", price: `${formatMxn(ACADEMIX_SUBSCRIPTION_PLANS.monthly.priceMxn)} / mes`, description: "Durante un mes puedes estudiar todos los cursos incluidos en Academix Plus.", features: ["Cursos incluidos sin compra individual", "Progreso y recursos", "Certificados cuando correspondan", "Renovación mensual cuando se conecte la pasarela"], action: "Ver cursos", to: ROUTES.courses },
  { name: "Academix Plus Anual", eyebrow: "Mejor valor", price: `${formatMxn(ACADEMIX_SUBSCRIPTION_PLANS.annual.priceMxn)} / año`, description: "Acceso anual a todos los cursos incluidos en el plan con una sola suscripción.", features: ["12 meses de acceso", "Cursos incluidos ilimitados", "Progreso y certificados", "Ahorro frente al plan mensual"], action: "Ver cursos", to: ROUTES.courses },
  { name: "Compra por curso", eyebrow: "Sin suscripción", price: "Paga solo lo que estudias", description: "Compra uno o varios cursos y consérvalos en tu cuenta según las condiciones de Academix.", features: ["Carrito de varios cursos", "Precio visible antes de comprar", "Acceso al curso adquirido", "Certificado cuando el curso lo incluya"], action: "Explorar cursos", to: ROUTES.courses },
  { name: "Publica en Academix", eyebrow: "Instructores independientes", price: "Ingresos por tus cursos", description: "Crea, envía una vez a revisión y, después de ser aprobado, edita o da de baja tu curso desde tu panel.", features: ["Panel de instructor", "Precio por curso", "Revisión inicial de Academix", "Notificación cuando el curso sea aprobado"], action: "Quiero enseñar", to: ROUTES.instructorApplication },
];

const organizationPlans = [
  {
    name: "Academix Organizaciones",
    eyebrow: "Universidades y empresas",
    price: "Cotización personalizada",
    description: "Un espacio institucional para reunir estudiantes, instructores y cursos propios bajo una misma organización.",
    features: ["Panel de organización", "Roles de administrador, instructor y estudiante", "Cursos institucionales con flujo de aprobación", "Los estudiantes activos acceden sin pago adicional a los cursos de su organización", "Los cursos institucionales están incluidos en el plan y no tienen precio individual"],
    action: "Crear mi organización",
    to: ROUTES.organization,
  },
  {
    name: "Academix Campus",
    eyebrow: "Operación a mayor escala",
    price: "Hablemos de tu proyecto",
    description: "Para instituciones que necesitan planear una implementación con más usuarios y acompañamiento comercial.",
    features: ["Base multiusuario", "Gobierno de cursos institucionales", "Seguimiento de miembros", "Preparado para ampliar facturación y licencias en fases posteriores"],
    action: "Contactar a Academix",
    to: ROUTES.contact,
  },
];

export default function PricingPage() {
  const [audience, setAudience] = useState<"people" | "organizations">("people");
  const plans = audience === "people" ? personPlans : organizationPlans;

  return (
    <PublicLayout active="precios">
      <section className="relative overflow-hidden px-6 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.28),transparent_38%),radial-gradient(circle_at_80%_25%,rgba(59,130,246,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Precios Academix</span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Elige cómo quieres aprender o enseñar</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">Academix separa el aprendizaje individual del acceso institucional para que cada experiencia tenga reglas claras.</p>
          <div className="mx-auto mt-9 inline-flex rounded-2xl border border-white/10 bg-slate-900/70 p-1.5" role="group" aria-label="Tipo de precios">
            <button type="button" onClick={() => setAudience("people")} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${audience === "people" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-400 hover:text-white"}`}>Personas</button>
            <button type="button" onClick={() => setAudience("organizations")} className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${audience === "organizations" ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-400 hover:text-white"}`}>Organizaciones</button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <article key={plan.name} className={`relative flex flex-col rounded-3xl border bg-slate-900/70 p-7 shadow-2xl shadow-black/15 sm:p-8 ${index === 0 ? "border-brand-400/45 ring-1 ring-brand-400/10" : "border-white/10"}`}>
              {index === 0 ? <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">Recomendado</span> : null}
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{plan.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-bold text-white">{plan.name}</h2>
              <p className="mt-5 text-2xl font-extrabold text-brand-200">{plan.price}</p>
              <p className="mt-4 min-h-20 text-sm leading-6 text-slate-400">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3"><span className="mt-0.5 text-brand-300" aria-hidden="true">✓</span><span>{feature}</span></li>)}
              </ul>
              <Link to={plan.to} className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition hover:bg-brand-500">{plan.action}</Link>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">Los precios mostrados son la propuesta inicial de Academix y están centralizados para poder ajustarlos. El cobro se activará únicamente cuando exista una pasarela de pago segura conectada.</p>
      </section>
    </PublicLayout>
  );
}
