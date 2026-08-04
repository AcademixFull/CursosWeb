export const MOCK_ENROLLMENTS_KEY = "academix.mock-enrollments.v1";
export const MOCK_LEARNING_PROGRESS_KEY = "academix.learning-progress.v1";

export function clearMockStudentStorage(): void {
  sessionStorage.removeItem(MOCK_ENROLLMENTS_KEY);
  sessionStorage.removeItem(MOCK_LEARNING_PROGRESS_KEY);
}
