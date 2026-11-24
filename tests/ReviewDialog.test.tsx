import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewDialog } from "../src/components/reviews/ReviewDialog";

function renderDialog(onSubmit = vi.fn()) {
  render(
    <ReviewDialog
      courseTitle="TypeScript desde cero"
      isPending={false}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("ReviewDialog", () => {
  it("matches the backend limit of 2000 characters", () => {
    renderDialog();

    expect(screen.getByRole("textbox", { name: /comentario/i })).toHaveAttribute("maxlength", "2000");
    expect(screen.getByText("0/2000")).toBeInTheDocument();
  });

  it("rejects comments shorter than the backend minimum", () => {
    const onSubmit = renderDialog();
    fireEvent.change(screen.getByRole("textbox", { name: /comentario/i }), { target: { value: "Muy bien" } });
    fireEvent.click(screen.getByRole("button", { name: /publicar reseña/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("entre 10 y 2000 caracteres");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the selected rating and normalized comment", () => {
    const onSubmit = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "4 estrellas" }));
    fireEvent.change(screen.getByRole("textbox", { name: /comentario/i }), {
      target: { value: "  Un curso muy completo y claro.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /publicar reseña/i }));

    expect(onSubmit).toHaveBeenCalledWith({ rating: 4, comment: "Un curso muy completo y claro." });
  });
});
