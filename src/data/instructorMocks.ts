import type { InstructorDetail } from "../types/course.types";

type InstructorMock = Omit<InstructorDetail, "courseCount">;

export const instructorMocks: InstructorMock[] = [
  {
    id: "instructor-roberto",
    name: "Dr. Roberto Silva",
    specialty: "Arquitectura Web",
    biography:
      "Arquitecto de software y docente especializado en aplicaciones web escalables. Acompaña a equipos y estudiantes desde los fundamentos hasta la entrega de productos en producción.",
    experienceYears: 12,
    studentCount: 18400,
  },
  {
    id: "instructor-elena",
    name: "Elena Martínez",
    specialty: "Product Design",
    biography:
      "Diseñadora de producto enfocada en sistemas visuales, accesibilidad e investigación con usuarios. Convierte problemas complejos en experiencias digitales claras y consistentes.",
    experienceYears: 9,
    studentCount: 12600,
  },
  {
    id: "instructor-alejandro",
    name: "Dr. Alejandro Ruiz",
    specialty: "IA y Ciencia de Datos",
    biography:
      "Investigador y consultor en aprendizaje automático. Su trabajo conecta fundamentos matemáticos, experimentación reproducible y despliegue responsable de modelos.",
    experienceYears: 14,
    studentCount: 23100,
  },
  {
    id: "instructor-sofia",
    name: "Sofía Castro",
    specialty: "Growth Marketing",
    biography:
      "Estratega digital especializada en crecimiento medible, contenidos y optimización de campañas. Enseña a tomar decisiones de marketing respaldadas por datos.",
    experienceYears: 8,
    studentCount: 9800,
  },
  {
    id: "instructor-lucas",
    name: "Lucas Benítez",
    specialty: "Data Engineering",
    biography:
      "Ingeniero de datos con experiencia construyendo flujos analíticos y plataformas de información. Su enseñanza combina Python, buenas prácticas y proyectos reproducibles.",
    experienceYears: 10,
    studentCount: 15700,
  },
  {
    id: "instructor-andrea",
    name: "Andrea Soler",
    specialty: "Database Engineering",
    biography:
      "Especialista en bases de datos, rendimiento y observabilidad. Ayuda a diagnosticar problemas reales mediante modelado, índices y análisis de planes de ejecución.",
    experienceYears: 11,
    studentCount: 11200,
  },
];
