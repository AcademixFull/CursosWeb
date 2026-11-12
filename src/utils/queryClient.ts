import { QueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError } from "../services/api";
import { env } from "../config/env";

const publicNamespaces = new Set(["courses", "course", "categories", "instructor", "course-reviews", "certificate-verification", "plans"]);
export const isPrivateQuery = (key: QueryKey) => !publicNamespaces.has(String(key[0]));
export const privateScope = (user?: { id: string; role: string }) => [user?.id ?? "anonymous", user?.role ?? "anonymous"] as const;

export function createQueryClient(options: { maxInactive?: number; staleTime?: number } = {}): QueryClient {
  const client = new QueryClient({ defaultOptions: {
    queries: {
      staleTime: options.staleTime ?? env.cache.catalogTtlMs,
      gcTime: env.cache.gcTimeMs,
      refetchOnWindowFocus: true,
      retry: (count, error) => !(error instanceof ApiError && error.status > 0 && error.status < 500) && count < 1,
    },
    mutations: { retry: 0 },
  } });
  const maxInactive = options.maxInactive ?? env.cache.maxInactive;
  const access = new Map<string, number>();
  let sequence = 0;
  let pruning = false;
  client.getQueryCache().subscribe((event) => {
    if (event.type === "removed") { access.delete(event.query.queryHash); return; }
    access.set(event.query.queryHash, ++sequence);
    if (pruning) return;
    pruning = true;
    queueMicrotask(() => {
      const inactive = client.getQueryCache().getAll()
        .filter((query) => query.getObserversCount() === 0 && query.state.fetchStatus === "idle")
        .sort((a, b) => (access.get(a.queryHash) ?? 0) - (access.get(b.queryHash) ?? 0));
      for (const query of inactive.slice(0, Math.max(0, inactive.length - maxInactive))) client.getQueryCache().remove(query);
      pruning = false;
    });
  });
  // fetchQuery can return a fresh response without emitting a cache event.
  const fetchQuery = client.fetchQuery.bind(client);
  client.fetchQuery = ((...args: Parameters<typeof fetchQuery>) => {
    const found = client.getQueryCache().find({ queryKey: args[0].queryKey, exact: true });
    if (found) access.set(found.queryHash, ++sequence);
    return fetchQuery(...args);
  }) as typeof client.fetchQuery;
  return client;
}

export async function clearPrivateQueries(client: QueryClient): Promise<void> {
  const predicate = (query: { queryKey: QueryKey }) => isPrivateQuery(query.queryKey);
  await client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
  client.getMutationCache().clear();
}

export function invalidateCatalog(client: QueryClient): Promise<void> {
  return Promise.all(["courses", "course", "categories", "instructor"].map((root) =>
    client.invalidateQueries({ queryKey: [root] }))).then(() => undefined);
}
