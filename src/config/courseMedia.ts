import type { CourseMediaKind } from "../types/management.types";

export const COURSE_MEDIA_MAX_MB = 25;

export const courseMediaFormats: Record<CourseMediaKind, { label: string; mimeTypes: string[] }> = {
  cover: { label: "JPEG, PNG o WebP", mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
  intro: { label: "MP4", mimeTypes: ["video/mp4"] },
};
