import type { CourseSummary } from "./course.types";

export type EnrollmentStatus = "in_progress" | "completed";

export interface EnrollmentSummary {
  id: string;
  course: CourseSummary;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: string;
}

export interface CertificateSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: string;
  credentialCode: string;
}

export interface CertificateDetail extends CertificateSummary {
  recipientName: string;
  durationHours: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "instructor" | "admin";
  phone: string;
  country: string;
  bio: string;
}

export type UpdateProfileInput = Pick<UserProfile, "fullName" | "phone" | "country" | "bio">;
