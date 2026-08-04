import { env } from "../config/env";

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

  constructor(
    message: string,
    options: { status: number; code: ApiErrorCode; fields?: Record<string, string | string[]> }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields;
  }
}

type JsonBody = Record<string, unknown> | unknown[];

interface RequestOptions {
  /** Cuerpo de la petición; se serializa a JSON automáticamente. */
  body?: JsonBody;
  /** Headers adicionales/override. */
  headers?: HeadersInit;
  /** Señal para cancelar la petición (ej. AbortController desde React Query). */
  signal?: AbortSignal;
}

/**
 * Punto de extensión para autenticación (Fase 9 — Supabase Auth).
 *
 * Hoy siempre devuelve `undefined` porque todavía no hay sesión real ni
 * token que adjuntar. Cuando implementemos Supabase Auth, esta función
 * leerá el token de sesión (desde un AuthContext/store) y `request()`
 * ya está preparado para agregarlo como `Authorization: Bearer <token>`
 * sin que haya que tocar cada llamada existente.
 */
function getAuthToken(): string | undefined {
  return undefined;
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
    });
  }

  // El backend respondió pero no con el formato { success, data|error } esperado.
  if (!response.ok) {
    throw new ApiError(`Error HTTP ${response.status}`, {
      status: response.status,
      code: "UNKNOWN_ERROR",
    });
  }

  throw new ApiError("La respuesta del servidor no tiene el formato esperado.", {
    status: response.status,
    code: "INVALID_RESPONSE",
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

  const token = getAuthToken();
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
