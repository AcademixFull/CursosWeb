import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import HomePage from "../src/pages/HomePage";

vi.mock("../src/layouts/PublicLayout", () => ({ default: ({children}: {children: ReactNode}) => <>{children}</> }));
vi.mock("../src/hooks/useCourses", () => ({ useFeaturedCourses: () => ({isPending:false,isError:false,data:[]}) }));

describe("Academix home artwork", () => {
  it("shows the education artwork instead of an upcoming feature placeholder", () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole("img", {name:"Academix: tecnología, conocimiento y aprendizaje conectado"})).toBeInTheDocument();
    expect(screen.queryByText(/pr[oó]ximamente/i)).not.toBeInTheDocument();
  });
});
