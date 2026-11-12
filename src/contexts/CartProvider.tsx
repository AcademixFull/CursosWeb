import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMyCourses, useCourseOwnership } from "../hooks/useStudent";
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
  const ownership = useCourseOwnership(items.map((item) => item.id));
  const confirmedOwned = useMemo(() => new Set([...ownedCourseIds, ...(ownership.data ?? [])]), [ownedCourseIds, ownership.data]);
  const confirmedReady = ownershipReady && (items.length === 0 || ownership.isSuccess);

  useEffect(() => {
    localStorage.removeItem(LEGACY_KEY);
  }, []);

  const availableItems = useMemo(
    () => confirmedReady ? items.filter((item) => !confirmedOwned.has(item.id)) : items,
    [items, confirmedOwned, confirmedReady],
  );

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(cartKey(userId), JSON.stringify(availableItems));
  }, [availableItems, userId]);

  const value = useMemo(() => ({
    items: availableItems,
    count: availableItems.length,
    total: availableItems.reduce((sum, item) => sum + item.price, 0),
    ownershipReady: confirmedReady,
    ownsCourse: (courseId: string) => confirmedOwned.has(courseId),
    addCourse: (course: CourseSummary) => {
      if (!userId || !ownershipReady || confirmedOwned.has(course.id) || items.length >= 50) return;
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
  }), [availableItems, items, confirmedOwned, confirmedReady, ownershipReady, userId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated ? user?.id : undefined;
  const enrollmentsQuery = useMyCourses(Boolean(userId));
  const ownedCourseIds = useMemo(
    () => new Set(enrollmentsQuery.data?.filter((enrollment) => enrollment.accessActive !== false).map((enrollment) => enrollment.course.id) ?? []),
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
