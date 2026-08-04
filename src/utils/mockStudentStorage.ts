export const MOCK_ENROLLMENTS_KEY = "academix.mock-enrollments.v1";
export const MOCK_LEARNING_PROGRESS_KEY = "academix.learning-progress.v1";
export const MOCK_CERTIFICATE_DATES_KEY = "academix.mock-certificate-dates.v1";

export function clearMockStudentStorage(): void {
  sessionStorage.removeItem(MOCK_ENROLLMENTS_KEY);
  sessionStorage.removeItem(MOCK_LEARNING_PROGRESS_KEY);
  sessionStorage.removeItem(MOCK_CERTIFICATE_DATES_KEY);
}
