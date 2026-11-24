import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonResources } from "../src/components/learning/LessonResources";
import { getLearningResourceContent } from "../src/services/learning.service";
import type { LearningResource } from "../src/types/learning.types";

vi.mock("../src/services/learning.service", () => ({
  getLearningResourceContent: vi.fn(),
}));

const baseResource: LearningResource = {
  id: "resource-1",
  type: "PDF",
  title: "Guía de estudio",
  description: "Material de apoyo",
  required: true,
  position: 1,
  url: null,
  contentPath: "/api/v1/lessons/lesson-1/resources/resource-1/content",
};

describe("LessonResources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const NativeURL = URL;
    vi.stubGlobal("URL", Object.assign(class extends NativeURL {}, {
      createObjectURL: vi.fn(() => "blob:protected-resource"),
      revokeObjectURL: vi.fn(),
    }));
  });

  it("opens safe external resources in a separate tab", () => {
    render(<LessonResources resources={[{ ...baseResource, url: "https://docs.example.com/guide", contentPath: null }]} />);

    expect(screen.getByRole("link", { name: /abrir enlace externo/i })).toHaveAttribute("target", "_blank");
  });

  it("does not render unsafe external protocols", () => {
    render(<LessonResources resources={[{ ...baseResource, url: "javascript:alert(1)", contentPath: null }]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Este recurso no está disponible.")).toBeInTheDocument();
  });

  it("loads protected files through the backend before rendering them", async () => {
    vi.mocked(getLearningResourceContent).mockResolvedValue({
      blob: new Blob(["PDF"], { type: "application/pdf" }),
      contentType: "application/pdf",
      fileName: "guia.pdf",
    });
    render(<LessonResources resources={[baseResource]} />);

    fireEvent.click(screen.getByRole("button", { name: /abrir recurso protegido/i }));

    await waitFor(() => expect(getLearningResourceContent).toHaveBeenCalledWith(baseResource, expect.any(AbortSignal)));
    expect(await screen.findByTitle("Guía de estudio")).toHaveAttribute("src", "blob:protected-resource");
  });
});
