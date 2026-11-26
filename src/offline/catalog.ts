import { ApiError } from "../services/api";
import { offlineStore } from "./store";

// A bounded set of public snapshots, isolated by API and app base.
export async function withCatalogSnapshot<T>(key: string, load: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  try {
    signal?.throwIfAborted();
    if (!navigator.onLine) throw new ApiError("Conéctate para descargar esta lista por primera vez.", { code: "NETWORK_ERROR", status: 0 });
    const result = await load();
    signal?.throwIfAborted();
    try { await offlineStore.put("public", "catalog", key, result); } catch { /* Storage is optional online. */ }
    return result;
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof ApiError && (error.code === "NETWORK_ERROR" || [502, 503, 504].includes(error.status))) {
      const saved = await offlineStore.get<T>("public", "catalog", key).catch(() => undefined);
      if (saved !== undefined) return saved;
    }
    throw error;
  }
}
