import { env } from "../config/env";
import { clearAuthSession, getAuthToken } from "../utils/authSessionStore";

export const AUTH_SESSION_EXPIRED_EVENT = "academix:auth-session-expired";

/**
 * Cliente HTTP central de academix-frontend.
 *
 * Ningún componente ni servicio debe usar `fetch` directamente contra
 * academix-backend: todos pasan por aquí para que la URL base, los
 * headers, la serialización JSON y el manejo de errores estén en un
 * solo lugar (regla de la sección 16 de la documentación técnica).
 *
 * Se usa la Fetch API nativa (sin Axios): para lo que necesitamos hoy
 * -body JSON, headers, códigos de estado- Fetch es suficiente, y evita
 * sumar una dependencia sin una necesidad técnica real.
 */

/** Forma de respuesta exitosa que devuelve academix-backend. */
interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  pagination?: ApiPagination;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiPage<T> {
  items: T[];
  pagination: ApiPagination;
}

/** Forma de respuesta de error que devuelve academix-backend (sección 11/19 de la doc.). */
interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string | string[]>;
  };
}

type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

/** Códigos de error que puede lanzar este cliente además de los que ya defina el backend. */
export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"
  | "UNKNOWN_ERROR"
  | (string & {});

/**
 * Error tipado que lanza `api.*` ante cualquier falla: HTTP, de red o de
 * parseo. Así los `services`/hooks solo necesitan capturar `ApiError`,
 * sin distinguir manualmente entre "el fetch falló" y "el backend
 * respondió con success:false".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string | string[]>;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    options: {
      status: number;
      code: ApiErrorCode;
      fields?: Record<string, string | string[]>;
      requestId?: string;
      retryAfterSeconds?: number;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
    this.requestId = options.requestId;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

type JsonBody = object;

interface RequestOptions {
  /** Cuerpo de la petición; se serializa a JSON automáticamente. */
  body?: JsonBody;
  /** Headers adicionales/override. */
  headers?: HeadersInit;
  /** Señal para cancelar la petición (ej. AbortController desde React Query). */
  signal?: AbortSignal;
  /** Token puntual, usado por el flujo de recuperación sin crear una sesión normal. */
  authToken?: string;
}

function retryAfterSeconds(response: Response): number | undefined {
  const value = response.headers.get("Retry-After");
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

  const retryDate = Date.parse(value);
  if (Number.isNaN(retryDate)) return undefined;
  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function responseMetadata(response: Response) {
  return {
    requestId: response.headers.get("x-request-id") ?? undefined,
    retryAfterSeconds: retryAfterSeconds(response),
  };
}

function notifyExpiredSession(): void {
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
}

function buildUrl(path: string): string {
  const base = env.apiUrl.replace(/\/+$/, ""); // sin slash final
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    // Todavía no existe academix-backend (o no se configuró VITE_API_URL).
    // Lanzamos un error claro en vez de hacer un fetch a una URL relativa
    // rota que fallaría de forma confusa.
    throw new ApiError(
      "VITE_API_URL no está configurada: academix-backend todavía no está disponible.",
      { status: 0, code: "NETWORK_ERROR" }
    );
  }

  return `${base}${cleanPath}`;
}

async function parseEnvelope<T>(response: Response): Promise<ApiSuccessEnvelope<T>> {
  // 204 No Content: no hay body que parsear.
  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("La respuesta del servidor no es JSON válido.", {
      status: response.status,
      code: "INVALID_RESPONSE",
      ...responseMetadata(response),
    });
  }

  const envelope = payload as Partial<ApiEnvelope<T>>;

  if (envelope.success === true) {
    return envelope as ApiSuccessEnvelope<T>;
  }

  if (envelope.success === false) {
    throw new ApiError(envelope.error?.message ?? "Error desconocido del servidor.", {
      status: response.status,
      code: (envelope.error?.code as ApiErrorCode) ?? "UNKNOWN_ERROR",
      fields: envelope.error?.fields,
      ...responseMetadata(response),
    });
  }

  // El backend respondió pero no con el formato { success, data|error } esperado.
  if (!response.ok) {
    throw new ApiError(`Error HTTP ${response.status}`, {
      status: response.status,
      code: "UNKNOWN_ERROR",
      ...responseMetadata(response),
    });
  }

  throw new ApiError("La respuesta del servidor no tiene el formato esperado.", {
    status: response.status,
    code: "INVALID_RESPONSE",
    ...responseMetadata(response),
  });
}

async function requestEnvelope<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<ApiSuccessEnvelope<T>> {
  const url = buildUrl(path);

  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const sessionToken = getAuthToken();
  const usesSessionToken = options.authToken === undefined;
  const token = options.authToken ?? sessionToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    // El fetch nunca llegó a completarse: sin conexión, CORS bloqueado,
    // backend caído, DNS, etc. `fetch` lanza TypeError en estos casos.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // cancelación intencional (ej. React Query): se re-lanza tal cual
    }
    throw new ApiError("No se pudo conectar con academix-backend.", {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 401 && usesSessionToken && sessionToken) {
    notifyExpiredSession();
  }

  return parseEnvelope<T>(response);
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await requestEnvelope<T>(method, path, options);
  return envelope.data;
}

async function requestPage<T>(path: string, options: Omit<RequestOptions, "body"> = {}): Promise<ApiPage<T>> {
  const envelope = await requestEnvelope<T[]>("GET", path, options);

  if (!envelope.pagination) {
    throw new ApiError("La respuesta paginada no incluye sus metadatos.", {
      status: 200,
      code: "INVALID_RESPONSE",
    });
  }

  return { items: envelope.data, pagination: envelope.pagination };
}

/** Cliente HTTP central. Todos los `*.service.ts` deben usar esto, nunca `fetch` directo. */
export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  getPage: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    requestPage<T>(path, options),
  post: <T>(path: string, body?: JsonBody, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: JsonBody, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
};
