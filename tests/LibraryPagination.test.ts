import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/config/env", () => ({ env: { dataSource: "api", apiUrl: "http://api.test" } }));
vi.mock("../src/services/api", () => ({ api: { getPage: vi.fn(), get: vi.fn() } }));
import { api } from "../src/services/api";
import { listMyCoursesPage } from "../src/services/student.service";

describe("library paging contract", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requests only the selected backend page and status", async () => {
    const page = { items: [], pagination: { page: 3, limit: 10, total: 76 } };
    vi.mocked(api.getPage).mockResolvedValue(page);
    expect(await listMyCoursesPage({ page: 3, limit: 10, status: "completed" })).toEqual(page);
    expect(api.getPage).toHaveBeenCalledWith("/users/me/courses", expect.objectContaining({
      params: { page: 3, limit: 10, status: "completed" },
    }));
    expect(api.get).not.toHaveBeenCalled();
  });
});
