import { Link } from 'react-router';
import Header from './components/Header';

interface ValueItem {
  icon: IconName;
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  // 👉 Pega aquí el link de la foto (ej: 'https://miurl.com/foto.jpg').
  // Si se deja vacío, se muestra un placeholder con las iniciales.
  photo: string;
}

type IconName = 'target' | 'globe' | 'bulb' | 'trend' | 'users' | 'rocket';

const values: ValueItem[] = [
  {
    icon: 'bulb',
    title: 'Innovación',
    description:
      'Buscamos constantemente nuevas formas de enseñar y aprender, integrando las últimas tecnologías.',
  },
  {
    icon: 'trend',
    title: 'Aprendizaje',
    description:
      'Fomentamos una cultura de mejora continua y curiosidad intelectual sin límites.',
  },
  {
    icon: 'users',
    title: 'Comunidad',
    description:
      'Creemos en el poder de la colaboración y el apoyo mutuo entre estudiantes e instructores.',
  },
  {
    icon: 'rocket',
    title: 'Crecimiento',
    description:
      'Nuestro éxito se mide por el progreso real y tangible de cada uno de nuestros usuarios.',
  },
];

// 👇 Estructura lista para los 4 integrantes.
// Solo agrega el link de la foto de cada quien en "photo".
const team: TeamMember[] = [
  {
    name: 'Eliud',
    role: '?',
    photo: '',
  },
  {
    name: 'Marco Antonio',
    role: '?',
    photo: '',
  },
  {
    name: 'Santiago',
    role: '?',
    photo: '',
  },
  {
    name: 'Amaury',
    role: '?',
    photo: '',
  },
];

function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  if (name === 'target') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    );
  }

  if (name === 'globe') {
    return (
      <svg {...common}>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9" />
      </svg>
    );
  }

  if (name === 'bulb') {
    return (
      <svg {...common}>
        <path d="M9 18h6M10 22h4" />
        <path d="M12 2a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-1.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 2Z" />
      </svg>
    );
  }

  if (name === 'trend') {
    return (
      <svg {...common}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 19c.7-3 3-4.8 5.5-4.8s4.8 1.8 5.5 4.8" />
        <circle cx="17" cy="9" r="2.6" />
        <path d="M15.5 14.6c1.9.2 3.6 1.7 4.2 4.4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14.5 3.5c2.5 1 4 3.5 4 6.5 0 1.7-.5 3-1.2 4.3L20 17l-2.7 2.7-2.7-2.7L11.9 20a8.6 8.6 0 0 1-4.3 1.2c-3 0-5.5-1.5-6.5-4 1.3-4.6 5.4-8 10.4-9a12 12 0 0 1 3-.7Z" />
      <circle cx="15" cy="9" r="1.4" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <Header active="nosotros" />

      <main>
        <section className="relative overflow-hidden px-6 py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.38),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.22),transparent_28%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Nuestra historia
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Transformando la{' '}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-violet-400 to-fuchsia-400">
                educación digital
              </span>
            </h1>
            <p className="mx-auto mt-6 max-2xl text-lg leading-8 text-slate-300">
              En Academix, creemos que el conocimiento es la herramienta más poderosa para dar
              forma al futuro. Estamos construyendo el ecosistema de aprendizaje más avanzado
              para la próxima generación de profesionales.
            </p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-700/70 bg-slate-900 p-8 shadow-xl shadow-black/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/30">
                <Icon name="target" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-white">Nuestra Misión</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Democratizar el acceso a la educación tecnológica de alta calidad, rompiendo las
                barreras geográficas y económicas para que cualquier persona, en cualquier lugar,
                pueda adquirir las habilidades necesarias para prosperar en la economía digital.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-700/70 bg-slate-900 p-8 shadow-xl shadow-black/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/30">
                <Icon name="globe" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-white">Nuestra Visión</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Ser la plataforma líder mundial en formación digital, reconocida por nuestra
                innovación constante, la calidad de nuestros instructores y, sobre todo, por el
                éxito profesional de nuestros estudiantes.
              </p>
            </article>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Nuestros Valores
              </h2>
              <p className="mt-3 text-slate-400">
                Los principios que guían cada decisión que tomamos y cada curso que diseñamos.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <article
                  key={value.title}
                  className="rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/60"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/30">
                    <Icon name={value.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Nuestro talento
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                  Conoce al Equipo
                </h2>
                <p className="mt-3 max-w-2xl text-slate-400">
                  El grupo detrás de Academix, trabajando juntos para crear la mejor experiencia
                  de aprendizaje.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((member) => (
                <article
                  key={member.name}
                  className="flex flex-col items-center rounded-2xl border border-slate-700/70 bg-slate-900 p-6 text-center shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-violet-400/60"
                >
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-violet-400/40"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 text-xl font-bold text-violet-300 ring-2 ring-dashed ring-violet-400/40">
                      {initials(member.name)}
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-bold text-white">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{member.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 via-fuchsia-700 to-blue-700 p-8 text-center shadow-2xl shadow-violet-950/50 sm:p-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              ¿Listo para unirte a nuestra comunidad?
            </h2>
            <p className="mx-auto mt-4 max-2xl text-violet-100">
              Únete a miles de estudiantes que ya están transformando sus carreras profesionales
              con Academix.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/cursos"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Explorar Catálogo
              </Link>
              <Link
                to="/contacto"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <p>Academix. Formación moderna para equipos y profesionales.</p>
          <div className="flex gap-4">
            <Link to="/" className="transition hover:text-white">
              Inicio
            </Link>
            <Link to="/cursos" className="transition hover:text-white">
              Cursos
            </Link>
            <Link to="/contacto" className="transition hover:text-white">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}