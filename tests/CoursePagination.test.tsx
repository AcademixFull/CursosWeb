import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CoursePagination } from "../src/components/courses/CoursePagination";

describe("CoursePagination", () => {
  it("navigates to the previous and next pages", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <CoursePagination
        pagination={{ page: 2, limit: 12, total: 30, totalPages: 3 }}
        isFetching={false}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Paginación del catálogo" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /anterior/i }));
    await user.click(screen.getByRole("button", { name: /siguiente/i }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
  });

  it("disables navigation while fetching", () => {
    render(
      <CoursePagination
        pagination={{ page: 2, limit: 12, total: 30, totalPages: 3 }}
        isFetching
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeDisabled();
  });

  it("does not render for a single page", () => {
    const { container } = render(
      <CoursePagination
        pagination={{ page: 1, limit: 12, total: 6, totalPages: 1 }}
        isFetching={false}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
