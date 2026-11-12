import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient, clearPrivateQueries } from "../src/utils/queryClient";

describe("bounded query cache", () => {
  afterEach(() => vi.useRealTimers());
  it("reuses fresh results, deduplicates requests and revalidates expired entries", async () => {
    vi.useFakeTimers();
    const client = createQueryClient({ maxInactive: 3, staleTime: 100 });
    let reads = 0;
    const query = { queryKey: ["courses", { page: 1, limit: 10 }], queryFn: async () => ++reads };
    expect(await Promise.all([client.fetchQuery(query), client.fetchQuery(query)])).toEqual([1, 1]);
    expect(await client.fetchQuery(query)).toBe(1);
    await vi.advanceTimersByTimeAsync(101);
    expect(await client.fetchQuery(query)).toBe(2);
    client.clear();
  });
  it("evicts least recently used inactive results within the configured bound", async () => {
    const client = createQueryClient({ maxInactive: 2 });
    const read = (id: string) => client.fetchQuery({ queryKey: ["courses", id], queryFn: async () => id });
    await read("first"); await read("second"); await read("first"); await read("third");
    await Promise.resolve();
    expect(client.getQueryData(["courses", "first"])).toBe("first");
    expect(client.getQueryData(["courses", "second"])).toBeUndefined();
    expect(client.getQueryCache().getAll()).toHaveLength(2);
    client.clear();
  });
  it("removes every private namespace while retaining public catalog responses", async () => {
    const client = createQueryClient();
    for (const key of ["student", "organizations", "notifications", "management", "subscriptions", "learning"]) {
      client.setQueryData([key, "alice"], { private: true });
    }
    client.setQueryData(["courses", "featured"], []);
    await clearPrivateQueries(client);
    expect(client.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([["courses", "featured"]]);
    client.clear();
  });
  it("automatically deletes inactive queries when their configured lifetime ends", async () => {
    vi.useFakeTimers();
    const client = createQueryClient();
    await client.fetchQuery({ queryKey: ["courses", "expired"], queryFn: async () => "metadata" });
    await vi.advanceTimersByTimeAsync(300_001);
    expect(client.getQueryData(["courses", "expired"])).toBeUndefined();
    client.clear();
  });
});
