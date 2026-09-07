import { createContext } from "react";
import type { CourseSummary } from "../types/course.types";

export interface CartItem { id: string; title: string; price: number; instructorName: string; imageUrl?: string }
export interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addCourse: (course: CourseSummary) => void;
  removeCourse: (courseId: string) => void;
  clear: () => void;
  hasCourse: (courseId: string) => boolean;
}
export const CartContext = createContext<CartContextValue | null>(null);
