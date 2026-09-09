import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMyCourses } from "../hooks/useStudent";
import type { CourseSummary } from "../types/course.types";
import { CartContext, type CartItem } from "./cart-context";

const LEGACY_KEY = "academix:cart";

function cartKey(userId: string): string {
  return `academix:cart:${userId}`;
}

function readItems(userId: string | undefined): CartItem[] {
  if (!userId) return [];
  try {
    const value = JSON.parse(localStorage.getItem(cartKey(userId)) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

interface CartStateProps {
  userId: string | undefined;
  ownershipReady: boolean;
  ownedCourseIds: Set<string>;
  children: ReactNode;
}

function CartState({ userId, ownershipReady, ownedCourseIds, children }: CartStateProps) {
  const [items, setItems] = useState<CartItem[]>(() => readItems(userId));

  useEffect(() => {
    localStorage.removeItem(LEGACY_KEY);
  }, []);

  const availableItems = useMemo(
    () => ownershipReady ? items.filter((item) => !ownedCourseIds.has(item.id)) : items,
    [items, ownedCourseIds, ownershipReady],
  );

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(cartKey(userId), JSON.stringify(availableItems));
  }, [availableItems, userId]);

  const value = useMemo(() => ({
    items: availableItems,
    count: availableItems.length,
    total: availableItems.reduce((sum, item) => sum + item.price, 0),
    ownershipReady,
    ownsCourse: (courseId: string) => ownedCourseIds.has(courseId),
    addCourse: (course: CourseSummary) => {
      if (!userId || !ownershipReady || ownedCourseIds.has(course.id)) return;
      setItems((current) => current.some((item) => item.id === course.id)
        ? current
        : [...current, {
            id: course.id,
            title: course.title,
            price: course.price,
            instructorName: course.instructor.name,
            imageUrl: course.imageUrl,
          }]);
    },
    removeCourse: (courseId: string) => {
      if (!userId) return;
      setItems((current) => current.filter((item) => item.id !== courseId));
    },
    clear: () => setItems([]),
    hasCourse: (courseId: string) => items.some((item) => item.id === courseId),
  }), [availableItems, items, ownedCourseIds, ownershipReady, userId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated ? user?.id : undefined;
  const enrollmentsQuery = useMyCourses(Boolean(userId));
  const ownedCourseIds = useMemo(
    () => new Set(enrollmentsQuery.data?.map((enrollment) => enrollment.course.id) ?? []),
    [enrollmentsQuery.data],
  );

  return (
    <CartState
      key={userId ?? "guest"}
      userId={userId}
      ownershipReady={!userId || enrollmentsQuery.isSuccess}
      ownedCourseIds={ownedCourseIds}
    >
      {children}
    </CartState>
  );
}
