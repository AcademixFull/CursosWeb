import { env } from "../config/env";
import { expireAuthCredentials, getAuthToken } from "../utils/authSessionStore";

export const AUTH_SESSION_EXPIRED_EVENT = "academix:auth-session-expired";
const sessionRequests = new Set<AbortController>();
const responseControllers = new WeakMap<Response, AbortController>();
let sessionRevision = 0;
export function abortSessionRequests(): void {
  sessionRevision++;
  for (const controller of sessionRequests) controller.abort();
  sessionRequests.clear();
}

async function sessionFetch(url: string, options: RequestInit, sessionBound: boolean): Promise<Response> {
  if (!sessionBound) return fetch(url, options);
  const controller = new AbortController();
  sessionRequests.add(controller);
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  try {
    const response = await fetch(url, { ...options, signal });
    if (signal.aborted) throw new DOMException("Session changed", "AbortError");
    responseControllers.set(response, controller);
    return response;
  } catch (error) { sessionRequests.delete(controller); throw error; }
}

function releaseResponse(response: Response): void {
  const controller = responseControllers.get(response);
  if (controller) sessionRequests.delete(controller);
  responseControllers.delete(response);
}
async function readResponse<T>(response: Response, read: () => Promise<T>): Promise<T> {
  try { return await read(); } finally { releaseResponse(response); }
}

const GENERIC_CONNECTIVITY_MESSAGE =
  "No pudimos comunicarnos con Academix. Intenta nuevamente en unos momentos.";
const GENERIC_OPERATION_MESSAGE =
  "No pudimos completar la operación. Intenta nuevamente.";
const TECHNICAL_MESSAGE_PATTERN =
  /(?:academix-backend|\bbackend\b|\bapi\b|supabase|vite_api_url|fetch|network|cors|json|http\s*\d*|endpoint|authorization|x-file-name|sql|postgres|database|request[_ -]?id|p0001|\bslug\b|metadatos?|node_modules|localhost|127\.0\.0\.1|econn\w*|enotfound|etimedout|typeerror|referenceerror|syntaxerror|cannot read|undefined|stack trace|failed to)/i;

function publicErrorMessage(
  message: string | undefined,
  options: { status: number; code: ApiErrorCode },
): string {
  const value = message?.trim();
  if (options.code === "NETWORK_ERROR") return GENERIC_CONNECTIVITY_MESSAGE;
  if (!value) return GENERIC_OPERATION_MESSAGE;
  if (options.status >= 500 || options.code === "INVALID_RESPONSE" || options.code === "UNKNOWN_ERROR") {
    return GENERIC_OPERATION_MESSAGE;
  }
  if (TECHNICAL_MESSAGE_PATTERN.test(value) || /^[A-Z0-9_]{4,}$/.test(value)) {
    return GENERIC_OPERATION_MESSAGE;
  }
  return value;
}

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

export interface ApiBinary {
  blob: Blob;
  contentType: string;
  fileName?: string;
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

/**
 * Convierte cualquier error que vaya a renderizarse en un mensaje apto para la persona usuaria.
 * Los detalles técnicos pueden conservarse en consola, pero no deben aparecer en la interfaz.
 */
export function userErrorMessage(error: unknown, fallback = GENERIC_OPERATION_MESSAGE): string {
  const safeFallback = fallback.trim() || GENERIC_OPERATION_MESSAGE;
  if (error instanceof ApiError) {
    const message = publicErrorMessage(error.message, { status: error.status, code: error.code });
    return message === GENERIC_OPERATION_MESSAGE ? safeFallback : message;
  }
  if (!(error instanceof Error)) return safeFallback;

  const value = error.message.trim();
  if (!value || TECHNICAL_MESSAGE_PATTERN.test(value) || /^[A-Z0-9_]{4,}$/.test(value)) {
    return safeFallback;
  }
  return value;
}

type JsonBody = object;

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
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
  expireAuthCredentials();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
  }
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = env.apiUrl.replace(/\/+$/, ""); // sin slash final
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    // Todavía no existe academix-backend (o no se configuró VITE_API_URL).
    // Lanzamos un error claro en vez de hacer un fetch a una URL relativa
    // rota que fallaría de forma confusa.
    throw new ApiError(GENERIC_CONNECTIVITY_MESSAGE, {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  const url = new URL(`${base}${cleanPath}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function parseEnvelope<T>(response: Response): Promise<ApiSuccessEnvelope<T>> {
  // 204 No Content: no hay body que parsear.
  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(GENERIC_OPERATION_MESSAGE, {
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
    const code = (envelope.error?.code as ApiErrorCode) ?? "UNKNOWN_ERROR";
    throw new ApiError(
      publicErrorMessage(envelope.error?.message, { status: response.status, code }),
      {
        status: response.status,
        code,
        fields: envelope.error?.fields,
        ...responseMetadata(response),
      },
    );
  }

  // El backend respondió pero no con el formato { success, data|error } esperado.
  if (!response.ok) {
    throw new ApiError(GENERIC_OPERATION_MESSAGE, {
      status: response.status,
      code: "UNKNOWN_ERROR",
      ...responseMetadata(response),
    });
  }

  throw new ApiError(GENERIC_OPERATION_MESSAGE, {
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
  const revision = sessionRevision;
  const url = buildUrl(path, options.params);

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
    response = await sessionFetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    }, usesSessionToken && Boolean(sessionToken));
  } catch (error) {
    // El fetch nunca llegó a completarse: sin conexión, CORS bloqueado,
    // backend caído, DNS, etc. `fetch` lanza TypeError en estos casos.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error; // cancelación intencional (ej. React Query): se re-lanza tal cual
    }
    throw new ApiError(GENERIC_CONNECTIVITY_MESSAGE, {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 401 && usesSessionToken && sessionToken) {
    releaseResponse(response);
    notifyExpiredSession();
  }

  const result = await readResponse(response, () => parseEnvelope<T>(response));
  if (usesSessionToken && sessionToken && revision !== sessionRevision) throw new DOMException("Session changed", "AbortError");
  return result;
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

function contentDispositionFileName(value: string | null): string | undefined {
  if (!value) return undefined;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  return value.match(/filename="([^"]+)"/i)?.[1];
}

async function requestBinary(
  path: string,
  options: Omit<RequestOptions, "body"> = {},
): Promise<ApiBinary> {
  const revision = sessionRevision;
  const headers = new Headers(options.headers);
  headers.set("Accept", "*/*");
  const sessionToken = getAuthToken();
  const token = options.authToken ?? sessionToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await sessionFetch(buildUrl(path, options.params), { method: "GET", headers, signal: options.signal }, options.authToken === undefined && Boolean(sessionToken));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(GENERIC_CONNECTIVITY_MESSAGE, {
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  if (response.status === 401 && options.authToken === undefined && sessionToken) {
    releaseResponse(response);
    notifyExpiredSession();
  }
  if (!response.ok) {
    await readResponse(response, () => parseEnvelope<never>(response));
  }

  const blob = await readResponse(response, () => response.blob());
  if (options.authToken === undefined && sessionToken && revision !== sessionRevision) throw new DOMException("Session changed", "AbortError");
  return {
    blob,
    contentType: response.headers.get("Content-Type") ?? "application/octet-stream",
    fileName: contentDispositionFileName(response.headers.get("Content-Disposition")),
  };
}

async function requestRaw<T>(
  method: string,
  path: string,
  body: BodyInit,
  options: Omit<RequestOptions, "body"> = {},
): Promise<T> {
  const revision = sessionRevision;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const sessionToken = getAuthToken();
  const token = options.authToken ?? sessionToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await sessionFetch(buildUrl(path, options.params), { method, headers, body, signal: options.signal }, options.authToken === undefined && Boolean(sessionToken));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(GENERIC_CONNECTIVITY_MESSAGE, { status: 0, code: "NETWORK_ERROR" });
  }
  if (response.status === 401 && options.authToken === undefined && sessionToken) { releaseResponse(response); notifyExpiredSession(); }
  const result = (await readResponse(response, () => parseEnvelope<T>(response))).data;
  if (options.authToken === undefined && sessionToken && revision !== sessionRevision) throw new DOMException("Session changed", "AbortError");
  return result;
}

/** Cliente HTTP central. Todos los `*.service.ts` deben usar esto, nunca `fetch` directo. */
export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, options),
  getPage: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    requestPage<T>(path, options),
  getBinary: (path: string, options?: Omit<RequestOptions, "body">) =>
    requestBinary(path, options),
  post: <T>(path: string, body?: JsonBody, options?: Omit<RequestOptions, "body">) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: JsonBody, options?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...options, body }),
  postBinary: <T>(path: string, body: Blob, options?: Omit<RequestOptions, "body">) =>
    requestRaw<T>("POST", path, body, options),
  patch: <T>(path: string, body?: JsonBody, options?: Omit<RequestOptions, "body">) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, options),
};
