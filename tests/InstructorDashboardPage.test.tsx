import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InstructorDashboardPage from "../src/pages/InstructorDashboardPage";

const state = vi.hoisted(() => ({
  courses: {
    isPending: false,
    error: null as unknown,
    data: {
      items: [
        {
          id: "course-moderated",
          slug: "programacion-desde-cero",
          title: "Programación desde cero",
          shortDescription: "Curso Programación desde cero",
          description: "Curso de programación",
          learningOutcomes: [],
          requirements: [],
          targetAudience: "Estudiantes",
          categoryId: 1,
          level: "beginner",
          modality: "self_paced",
          language: "es",
          durationHours: 8,
          price: 0,
          certificateEnabled: true,
          requiresApproval: false,
          status: "moderated" as const,
          active: false,
          organization: null,
          instructor: { id: "instructor-1", name: "Instructor" },
          publishedAt: null,
          createdAt: "2026-09-09T00:00:00.000Z",
          updatedAt: "2026-09-09T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
  },
  updateInstructorCourse: vi.fn(),
}));

vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "instructor-1", fullName: "Instructor", email: "instructor@academix.test", role: "instructor" },
  }),
}));

vi.mock("../src/hooks/useOrganizations", () => ({
  useOrganizations: () => ({ data: [] }),
}));

vi.mock("../src/hooks/useManagement", () => ({
  managementQueryKeys: { instructorCourses: ["management", "instructor-courses"] },
  useInstructorCourses: () => state.courses,
  useCourseOptions: () => ({ data: undefined }),
}));

vi.mock("../src/services/management.service", () => ({
  managementService: {
    submitInstructorCourse: vi.fn(),
    updateInstructorCourse: state.updateInstructorCourse,
    archiveInstructorCourse: vi.fn(),
    createInstructorCourse: vi.fn(),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <InstructorDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InstructorDashboardPage", () => {
  beforeEach(() => {
    state.updateInstructorCourse.mockReset();
    state.updateInstructorCourse.mockResolvedValue(state.courses.data.items[0]);
  });

  it("permite corregir el precio de un curso dado de baja por moderación", async () => {
    const user = userEvent.setup();
    renderPage();

    const price = screen.getByRole("spinbutton", { name: "Precio de Programación desde cero" });
    expect(price).toHaveValue(0);
    expect(screen.getByRole("button", { name: "Guardar corrección" })).toBeInTheDocument();
    expect(screen.getByText(/Corrige el precio, los datos o el contenido señalado/i)).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, "50");
    await user.click(screen.getByRole("button", { name: "Guardar corrección" }));

    await waitFor(() => {
      expect(state.updateInstructorCourse).toHaveBeenCalledWith(
        "course-moderated",
        expect.objectContaining({ price: 50 }),
      );
    });
  });
});
