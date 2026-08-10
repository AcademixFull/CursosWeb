import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMockStudentStorage,
  MOCK_ENROLLMENTS_KEY,
  MOCK_PROFILES_KEY,
  readMockProfile,
  saveMockProfile,
} from "../src/utils/mockStudentStorage";

const profile = {
  fullName: "Marco Antonio",
  phone: "+52 246 000 0000",
  country: "México",
  bio: "Estudiante de software.",
};

describe("mock student storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores profiles independently by user", () => {
    saveMockProfile("user-1", profile);
    saveMockProfile("user-2", { ...profile, fullName: "Otro estudiante" });

    expect(readMockProfile("user-1")).toEqual(profile);
    expect(readMockProfile("user-2")?.fullName).toBe("Otro estudiante");
  });

  it("ignores malformed storage", () => {
    sessionStorage.setItem(MOCK_PROFILES_KEY, "{invalid-json");

    expect(readMockProfile("user-1")).toBeUndefined();
  });

  it("clears all private mock data on logout", () => {
    saveMockProfile("user-1", profile);
    sessionStorage.setItem(MOCK_ENROLLMENTS_KEY, JSON.stringify(["course-1"]));

    clearMockStudentStorage();

    expect(sessionStorage.getItem(MOCK_PROFILES_KEY)).toBeNull();
    expect(sessionStorage.getItem(MOCK_ENROLLMENTS_KEY)).toBeNull();
  });
});
