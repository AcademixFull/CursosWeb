import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseIntroVideo } from "../src/components/courses/CourseIntroVideo";
import AuthoringPage from "../src/pages/AuthoringPage";
import { managementService } from "../src/services/management.service";
import type { AuthoringCourseMedia } from "../src/types/management.types";

const editor = vi.hoisted(() => ({
  media: {} as AuthoringCourseMedia,
  refresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "instructor" } }),
}));

vi.mock("../src/hooks/useManagement", () => ({
  useCourseContent: (courseId: string) => ({
    data: { courseId, media: editor.media, modules: [], status: "draft" },
  }),
  useInvalidateCourseContent: () => editor.refresh,
  useResourceOptions: () => ({ data: [] }),
}));

vi.mock("../src/services/management.service", () => ({
  managementService: { submitInstructorCourse: vi.fn(), uploadCourseMedia: vi.fn() },
}));

function authoringScreen(queryClient: QueryClient) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/authoring/course-1"]}>
        <Routes>
          <Route path="/authoring/:courseId" element={<AuthoringPage />} />
          <Route path="*" element={<p>Panel del instructor</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const coverUrl = "https://storage.test/cover.webp";
const videoUrl = "https://storage.test/intro.mp4";

describe("course media", () => {
  beforeEach(() => {
    editor.media = {};
    vi.clearAllMocks();
  });

  it("gates draft submission until both the cover and intro were saved", async () => {
    const queryClient = new QueryClient();
    const user = userEvent.setup();
    const view = render(authoringScreen(queryClient));
    const finish = screen.getByRole("button", { name: "Finalizar y enviar a revisión" });
    expect(finish).toBeDisabled();

    const file = new File(["cover"], "cover.webp", { type: "image/webp" });
    vi.mocked(managementService.uploadCourseMedia).mockResolvedValue({ coverUrl });
    await user.upload(screen.getByLabelText("Elegir portada"), file);
    await user.click(screen.getByRole("button", { name: "Subir portada" }));
    await waitFor(() => expect(editor.refresh).toHaveBeenCalled());
    expect(managementService.uploadCourseMedia).toHaveBeenCalledWith("course-1", "cover", file);

    editor.media = { coverUrl };
    view.rerender(authoringScreen(queryClient));
    expect(finish).toBeDisabled();

    editor.media = { coverUrl, introVideoUrl: videoUrl };
    view.rerender(authoringScreen(queryClient));
    expect(finish).toBeEnabled();
    vi.mocked(managementService.submitInstructorCourse).mockResolvedValue({} as Awaited<ReturnType<typeof managementService.submitInstructorCourse>>);
    await user.click(finish);
    await screen.findByText("Panel del instructor");
    expect(managementService.submitInstructorCourse).toHaveBeenCalledWith("course-1");
  });

  it("provides playback controls and restores playback after an error", async () => {
    const retry = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CourseIntroVideo src={videoUrl} poster={coverUrl} onRetry={retry} />);
    const intro = screen.getByLabelText("Video introductorio");
    expect(intro).toHaveAttribute("controls");
    expect(intro).toHaveAttribute("poster", coverUrl);
    fireEvent.error(intro);
    expect(screen.getByRole("status")).toHaveTextContent("No pudimos reproducir el video.");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(await screen.findByLabelText("Video introductorio")).toHaveAttribute("src", videoUrl);
  });
});
