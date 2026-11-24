import { courseMocks } from "./courseMocks";
import type { CourseDetail, CourseLesson } from "../types/course.types";
import type { LearningCourse, LearningLesson, LearningModule } from "../types/learning.types";
import { MOCK_LEARNING_PROGRESS_KEY } from "../utils/mockStudentStorage";
const DEFAULT_COMPLETED_LESSON_IDS = [
  "web-lesson-1",
  "web-lesson-2",
  "ml-lesson-1",
  "ui-lesson-1",
  "ui-lesson-2",
];

function readCompletedLessons(): Set<string> {
  try {
    const storedValue = sessionStorage.getItem(MOCK_LEARNING_PROGRESS_KEY);
    const lessonIds: unknown = storedValue ? JSON.parse(storedValue) : DEFAULT_COMPLETED_LESSON_IDS;
    return new Set(Array.isArray(lessonIds) ? lessonIds.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set(DEFAULT_COMPLETED_LESSON_IDS);
  }
}

function saveCompletedLessons(lessonIds: Set<string>): void {
  sessionStorage.setItem(MOCK_LEARNING_PROGRESS_KEY, JSON.stringify([...lessonIds]));
}

function lessonDescription(course: CourseDetail, lesson: CourseLesson): string {
  return `En esta lección de ${course.title} estudiarás ${lesson.title.toLocaleLowerCase("es")}. Encontrarás una explicación guiada y una actividad práctica para consolidar lo aprendido.`;
}

function buildModules(course: CourseDetail, completedIds: Set<string>): LearningModule[] {
  const sourceModules = course.modules.length
    ? course.modules
    : [{
        id: `${course.id}-module-introduction`,
        title: "Introducción al curso",
        position: 1,
        lessons: [{
          id: `${course.id}-lesson-welcome`,
          title: "Bienvenida y objetivos",
          durationMinutes: 12,
          isPreview: true,
        }],
      }];

  return sourceModules.map((module) => ({
    id: module.id,
    title: module.title,
    position: module.position,
    lessons: module.lessons.map<LearningLesson>((lesson) => ({
      ...lesson,
      description: lessonDescription(course, lesson),
      content: `Contenido de demostración para ${lesson.title}.\n\nRevisa los conceptos principales y completa la actividad antes de avanzar.`,
      isCompleted: completedIds.has(lesson.id),
      resources: [{
        id: `${lesson.id}-resource-guide`,
        type: "Enlace externo",
        title: "Guía complementaria",
        description: "Material adicional para practicar los contenidos de esta lección.",
        required: false,
        position: 1,
        url: "https://developer.mozilla.org/es/",
        contentPath: null,
      }],
    })),
  }));
}

function calculateProgress(modules: LearningModule[]) {
  const lessons = modules.flatMap((module) => module.lessons);
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
  return {
    completedLessons,
    totalLessons: lessons.length,
    progressPercentage: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
  };
}

export function getLearningCourseMock(courseId: string): LearningCourse | null {
  const course = courseMocks.find((item) => item.id === courseId || item.slug === courseId);
  if (!course) return null;

  const completedIds = readCompletedLessons();
  const modules = buildModules(course, completedIds);

  return {
    id: course.id,
    title: course.title,
    instructorName: course.instructor.name,
    modules,
    ...calculateProgress(modules),
  };
}

export function setLearningLessonProgressMock(
  courseId: string,
  lessonId: string,
  completed: boolean,
): LearningCourse | null {
  const completedIds = readCompletedLessons();
  if (completed) completedIds.add(lessonId);
  else completedIds.delete(lessonId);
  saveCompletedLessons(completedIds);
  return getLearningCourseMock(courseId);
}
