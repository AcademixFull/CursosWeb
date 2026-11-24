import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewPagination } from "../src/components/reviews/ReviewPagination";

describe("ReviewPagination", () => {
  it("navigates between review pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <ReviewPagination
        pagination={{ page: 2, limit: 5, total: 11, totalPages: 3 }}
        isFetching={false}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Paginación de reseñas" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /anterior/i }));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("does not render when every review fits on one page", () => {
    const { container } = render(
      <ReviewPagination
        pagination={{ page: 1, limit: 5, total: 2, totalPages: 1 }}
        isFetching={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
