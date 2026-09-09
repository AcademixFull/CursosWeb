import PublicLayout from "../layouts/PublicLayout";
import { faqSections } from "../data/faqSections";

function scrollToFaqSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  target?.scrollIntoView({ block: "start", behavior: "smooth" });
}

export default function FaqPage() {
  return (
    <PublicLayout active="preguntas">
      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-bold text-brand-300">Preguntas frecuentes</p>
            <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
              Centro de ayuda de Academix
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Reunimos en un solo lugar las dudas más comunes sobre cuentas, organizaciones,
              soporte e instructores.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {faqSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToFaqSection(section.id)}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-brand-400/50 hover:text-white"
              >
                {section.title}
              </button>
            ))}
          </div>

          <div className="mt-12 space-y-8">
            {faqSections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20 sm:p-8"
              >
                <header className="mb-6 border-b border-white/10 pb-5">
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
                </header>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <details
                      key={item.question}
                      className="group rounded-2xl border border-white/10 bg-slate-950/60 p-5 open:border-brand-400/30"
                    >
                      <summary className="flex list-none items-center justify-between gap-4 font-semibold text-slate-100">
                        <span>{item.question}</span>
                        <span
                          className="text-brand-300 transition group-open:rotate-45"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
