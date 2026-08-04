export interface LearningLesson {
  id: string;
  title: string;
  durationMinutes: number;
  description: string;
  isPreview: boolean;
  isCompleted: boolean;
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
