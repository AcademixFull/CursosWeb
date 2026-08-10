import type { UpdateProfileInput } from "../types/student.types";

export const MOCK_ENROLLMENTS_KEY = "academix.mock-enrollments.v1";
export const MOCK_LEARNING_PROGRESS_KEY = "academix.learning-progress.v1";
export const MOCK_CERTIFICATE_DATES_KEY = "academix.mock-certificate-dates.v1";
export const MOCK_PROFILES_KEY = "academix.mock-profiles.v1";

type StoredProfiles = Record<string, UpdateProfileInput>;

function readStoredProfiles(): StoredProfiles {
  try {
    const storedValue = sessionStorage.getItem(MOCK_PROFILES_KEY);
    const parsed: unknown = storedValue ? JSON.parse(storedValue) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, UpdateProfileInput] => {
        const profile = entry[1] as Partial<UpdateProfileInput> | null;
        return Boolean(
          profile &&
            typeof profile.fullName === "string" &&
            typeof profile.phone === "string" &&
            typeof profile.country === "string" &&
            typeof profile.bio === "string",
        );
      }),
    );
  } catch {
    return {};
  }
}

export function readMockProfile(userId: string): UpdateProfileInput | undefined {
  return readStoredProfiles()[userId];
}

export function saveMockProfile(userId: string, profile: UpdateProfileInput): void {
  sessionStorage.setItem(
    MOCK_PROFILES_KEY,
    JSON.stringify({ ...readStoredProfiles(), [userId]: profile }),
  );
}

export function clearMockStudentStorage(): void {
  sessionStorage.removeItem(MOCK_ENROLLMENTS_KEY);
  sessionStorage.removeItem(MOCK_LEARNING_PROGRESS_KEY);
  sessionStorage.removeItem(MOCK_CERTIFICATE_DATES_KEY);
  sessionStorage.removeItem(MOCK_PROFILES_KEY);
}
