import { Link } from 'react-router';
import { courseDetailRoute, ROUTES } from '../config/routes';
import { useFeaturedCourses } from '../hooks/useCourses';
import PublicLayout from '../layouts/PublicLayout';
import { formatMxn } from '../utils/currency';

const stats = [
  { value: '1000+', label: 'Estudiantes activos' },
  { value: '150+', label: 'Cursos premium' },
  { value: '50+', label: 'Instructores expertos' },
  { value: '95%', label: 'Satisfacción' },
];

const steps = [
  {
    title: 'Regístrate',
    description: 'Crea tu cuenta gratuita en segundos y accede a nuestro ecosistema educativo.',
  },
  {
    title: 'Aprende',
    description:
      'Accede a videolecciones en definición, recursos descargables y foros activos.',
  },
  {
    title: 'Certifícate',
    description:
      'Completa tus proyectos y obtén un certificado avalado por expertos de la industria.',
  },
];

const testimonials = [
  {
    name: 'Amaury Martinez Diaz',
    role: 'Desarrollador junior',
    quote:
      'Gracias a los cursos de Academix logré mi primer empleo en tecnología en menos de 6 meses. El contenido es extremadamente práctico.',
  },
  {
    name: 'Sanitago',
    role: 'Diseñador freelance',
    quote:
      'La calidad de los instructores es insuperable. El curso de UI/UX cambió por completo mi forma de entender los productos digitales.',
  },
  {
    name: 'Marco',
    role: 'Emprendedor',
    quote:
      'El soporte de la comunidad es increíble. Siempre hay alguien dispuesto a ayudarte con tus dudas en los foros de cada curso.',
  },
];

export default function HomePage() {
  const featuredCourses = useFeaturedCourses();

  return (
    <PublicLayout active="inicio">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.35),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.2),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <span className="inline-block rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
                Inicia tu carrera tech hoy
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Aprende habilidades{' '}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-400 via-fuchsia-400 to-blue-400">
                  reales
                </span>{' '}
                para el futuro.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300 lg:mx-0">
                Accede a más de 150 cursos especializados en las áreas de mayor demanda
                laboral. Aprende de expertos y obtén certificaciones internacionales.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <Link
                  to={ROUTES.courses}
                  className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-600/25 transition hover:bg-violet-500"
                >
                  Explorar Cursos
                </Link>
                <Link
                  to={ROUTES.instructorApplication}
                  className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Conviértete en Instructor
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-3 shadow-2xl shadow-violet-950/40 backdrop-blur">
              <div className="overflow-hidden rounded-xl">
                <div className="academix-brand-panel flex aspect-video w-full items-center justify-center text-center">
                  <div>
                    <p className="academix-on-brand text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                      Cursos tecnología
                    </p>
                    <p className="academix-on-brand mt-2 text-lg font-bold text-white">Proximamente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-white/10 bg-slate-900/40 px-6 py-12">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 text-center min-[420px]:grid-cols-2 sm:grid-cols-4 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cursos destacados */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                  Destacado
                </span>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                  Cursos Destacados
                </h2>
                <p className="mt-2 text-slate-400">
                  Los cursos independientes más tomados por la comunidad de Academix.
                </p>
              </div>
              <Link
                to={ROUTES.courses}
                className="text-sm font-semibold text-violet-300 transition hover:text-violet-200"
              >
                Ver todos los cursos →
              </Link>
            </div>

            <p className="-mt-6 mb-8 text-sm text-slate-500">
              Se muestran hasta 5 cursos independientes, ordenados por el número de inscripciones. Los cursos de organizaciones no participan en este ranking.
            </p>

            {featuredCourses.isPending ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Cargando cursos destacados...
              </div>
            ) : featuredCourses.isError ? (
              <div className="rounded-2xl border border-dashed border-red-400/30 p-8 text-center">
                <p className="text-sm text-red-200">No pudimos consultar los cursos destacados.</p>
                <button type="button" onClick={() => void featuredCourses.refetch()} className="mt-3 text-sm font-semibold text-violet-300">
                  Intentar de nuevo
                </button>
              </div>
            ) : featuredCourses.data.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {featuredCourses.data.map((course) => (
                  <article
                    key={course.id}
                    className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/60"
                  >
                    <div className="academix-soft-banner academix-soft-banner-text flex h-32 items-center justify-center overflow-hidden text-xs font-semibold uppercase tracking-wider text-violet-300">
                      {course.imageUrl ? <img src={course.imageUrl} alt="" className="h-full w-full object-cover" /> : course.category.name}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs text-slate-500">Por {course.instructor.name}</p>
                      <h3 className="mt-2 break-words text-base font-bold text-white">{course.title}</h3>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                        <span className="text-base font-extrabold text-violet-300">{formatMxn(course.price)}</span>
                        <Link
                          to={courseDetailRoute(course.id)}
                          className="text-sm font-semibold text-white transition hover:text-violet-300"
                        >
                          Ver Curso →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Aún no hay cursos independientes publicados para destacar.
              </div>
            )}
          </div>
        </section>

        {/* Pasos */}
        <section className="bg-slate-900/40 px-6 py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Tu camino al éxito en 3 pasos
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Nuestra metodología está diseñada para que aprendas haciendo, desde cero hasta
              profesional.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-left shadow-xl shadow-black/20"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-300 ring-1 ring-violet-400/30">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Lo que dicen nuestros estudiantes
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Miles de personas ya han transformado sus vidas gracias a la educación online.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.name}
                  className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-left shadow-xl shadow-black/20"
                >
                  <p className="text-sm leading-6 text-slate-300">"{testimonial.quote}"</p>
                  <div className="mt-5">
                    <p className="text-sm font-bold text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-400">{testimonial.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-6 py-20">
          <div className="academix-cta-panel mx-auto max-w-6xl overflow-hidden rounded-2xl p-8 text-center shadow-2xl shadow-violet-950/50 sm:p-12">
            <h2 className="academix-on-brand academix-cta-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Empieza hoy mismo tu transformación
            </h2>
            <p className="academix-on-brand academix-cta-body mx-auto mt-4 max-w-2xl text-violet-100">
              Únete a la comunidad de aprendizaje más vibrante de Latinoamérica. Sin cuotas
              mensuales obligatorias, paga solo por lo que aprendes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to={ROUTES.courses}
                className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Explorar Catálogo
              </Link>
              <Link
                to={ROUTES.register}
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Crear Cuenta Gratis
              </Link>
            </div>
          </div>
        </section>
    </PublicLayout>
  );
}
