import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CourseSummary } from "../types/course.types";
import { CartContext, type CartItem } from "./cart-context";

const KEY = "academix:cart";
function initialItems(): CartItem[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(items)), [items]);
  const value = useMemo(() => ({
    items,
    count: items.length,
    total: items.reduce((sum, item) => sum + item.price, 0),
    addCourse: (course: CourseSummary) => setItems((current) => current.some((item) => item.id === course.id) ? current : [...current, { id: course.id, title: course.title, price: course.price, instructorName: course.instructor.name, imageUrl: course.imageUrl }]),
    removeCourse: (courseId: string) => setItems((current) => current.filter((item) => item.id !== courseId)),
    clear: () => setItems([]),
    hasCourse: (courseId: string) => items.some((item) => item.id === courseId),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
