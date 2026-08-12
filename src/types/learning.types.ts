export interface LearningLesson {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  content: string;
  isPreview: boolean;
  isCompleted: boolean;
  resources: LearningResource[];
}

export interface LearningResource {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  position: number;
  url: string | null;
  contentPath: string | null;
}

export interface LearningModule {
  id: string;
  title: string;
  position: number;
  lessons: LearningLesson[];
}

export interface LearningCourse {
  id: string;
  title: string;
  instructorName: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  modules: LearningModule[];
}
