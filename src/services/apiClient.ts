import { ScopeLocation, UserRole } from '../types';
import { sessionManager, SESSION_KEYS } from './sessionManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4500';

const ACTIVE_SHOP_STORAGE_KEY = SESSION_KEYS.activeShop;

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';
export const NETWORK_ERROR_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const TIMEOUT_ERROR_MESSAGE = 'The server took too long to respond. Please try again.';

// Module-level so it's readable from `getHeaders()` without threading a shop
// id through every service call — the Shop Switcher (`ShopScopeContext`)
// is the only writer. Initialized synchronously from localStorage since the
// ApiClient singleton is constructed before React mounts. (`sessionManager`
// is evaluated first and has already purged this key if there is no session.)
let activeShopId: string | null =
  (typeof localStorage !== 'undefined' && localStorage.getItem(ACTIVE_SHOP_STORAGE_KEY)) || null;

export function setActiveShopId(shopId: string | null): void {
  activeShopId = shopId;
  try {
    if (shopId) localStorage.setItem(ACTIVE_SHOP_STORAGE_KEY, shopId);
    else localStorage.removeItem(ACTIVE_SHOP_STORAGE_KEY);
  } catch {
    // Storage may be disabled (private mode) — in-memory value still applies.
  }
}

export function getActiveShopId(): string | null {
  return activeShopId;
}

// A finished session must not leave the previous user's shop scope in memory.
sessionManager.onEnd(() => {
  activeShopId = null;
});

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Every failure `apiClient` throws. Callers that only read `.message` keep
 * working; the session layer uses the typed fields.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code?: string;
  /** No HTTP response at all: offline, DNS, CORS, timeout. Never a session problem. */
  readonly isNetworkError: boolean;
  /** The server rejected the credentials (401, or a blocked account). */
  readonly isAuthError: boolean;

  constructor(
    message: string,
    init: { status?: number | null; code?: string; isNetworkError?: boolean; isAuthError?: boolean } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = init.status ?? null;
    this.code = init.code;
    this.isNetworkError = init.isNetworkError ?? false;
    this.isAuthError = init.isAuthError ?? false;
  }
}

export interface RequestOptions {
  params?: Record<string, any>;
  /** JSON-serialised unless `formData` is given. Omit for bodiless requests. */
  body?: unknown;
  /** Sent as-is; the browser sets the multipart boundary. */
  formData?: FormData;
  headers?: Record<string, string>;
  /** Public endpoints (login): never attach the session token, never end a session on 401. */
  skipAuth?: boolean;
  /** Abort and fail as a network error after this long. */
  timeoutMs?: number;
}

/** Backend codes on a 403 that mean the session itself is dead (not "you lack permission"). */
const SESSION_TERMINATING_403 = new Set(['ACCOUNT_BLOCKED']);

class ApiClient {
  private baseUrl: string;
  private isConnected: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        this.isConnected = true;
        return true;
      }
    } catch {
      this.isConnected = false;
    }
    return false;
  }

  private getHeaders(customHeaders: Record<string, string> = {}, skipAuth = false): Record<string, string> {
    const role = (localStorage.getItem(SESSION_KEYS.role) as UserRole) || 'HQ Admin';
    const scope = (localStorage.getItem(SESSION_KEYS.scope) as ScopeLocation) || 'All Hubs (HQ Global)';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Role-Scope': role,
      'X-Warehouse-Scope': scope,
      ...(activeShopId ? { 'X-Shop-Id': activeShopId } : {}),
      ...customHeaders,
    };

    // `sessionManager.getToken()` is null once the session has ended, so a
    // request fired after logout can never carry the old token.
    const token = skipAuth ? null : sessionManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return url;
  }

  /**
   * The single choke point for every dashboard API call — and therefore the
   * single global unauthorized handler.
   */
  public async request<T>(method: string, endpoint: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const headers = this.getHeaders(opts.headers, opts.skipAuth);
    if (opts.formData) delete headers['Content-Type'];
    const bearer = headers['Authorization'];
    const tokenSent = bearer ? bearer.replace(/^Bearer /, '') : null;

    const controller = opts.timeoutMs ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), opts.timeoutMs) : null;

    let res: Response;
    try {
      res = await fetch(this.buildUrl(endpoint, opts.params), {
        method,
        headers,
        body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
        signal: controller?.signal,
      });
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API ${method}] ${endpoint} (${this.baseUrl}) — request failed; backend offline or misconfigured.`);
      const timedOut = controller?.signal.aborted === true;
      throw new ApiError(timedOut ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE, { isNetworkError: true });
    } finally {
      if (timer) clearTimeout(timer);
    }

    return this.handleResponse<T>(res, tokenSent);
  }

  private async handleResponse<T>(res: Response, tokenSent: string | null): Promise<ApiResponse<T>> {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      this.isConnected = false;
      throw new ApiError(
        `API endpoint returned HTML instead of JSON. Ensure VITE_API_BASE_URL points to the backend server (http://localhost:4500).`,
        { status: res.status }
      );
    }

    if (!res.ok) {
      // The backend always sends a real, useful `message` in its JSON error
      // body (e.g. "Wallet balance limit exceeded") — read it instead of
      // discarding it in favor of the generic HTTP status text, which is
      // rarely more informative than "Bad Request".
      let backendMessage: string | undefined;
      let code: string | undefined;
      try {
        const body = await res.json();
        backendMessage = body?.message;
        code = body?.code;
      } catch {
        // Body wasn't JSON (or was empty) — fall through to the generic message.
      }
      this.isConnected = true;

      const rejectsSession =
        res.status === 401 || (res.status === 403 && code !== undefined && SESSION_TERMINATING_403.has(code));

      if (rejectsSession && tokenSent) {
        // 401 → clear session → /login. `reportUnauthorized` is idempotent and
        // ignores a token that is no longer current, so a burst of concurrent
        // 401s (or a late reply from a previous user) causes at most one logout.
        sessionManager.reportUnauthorized(tokenSent);
        throw new ApiError(res.status === 401 ? SESSION_EXPIRED_MESSAGE : backendMessage || SESSION_EXPIRED_MESSAGE, {
          status: res.status,
          code,
          isAuthError: true,
        });
      }

      throw new ApiError(backendMessage || `HTTP error ${res.status}: ${res.statusText}`, {
        status: res.status,
        code,
      });
    }

    this.isConnected = true;
    return await res.json();
  }

  public get<T>(endpoint: string, params?: Record<string, any>, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, { params, headers: extraHeaders });
  }

  /**
   * For endpoints that return a binary body (PDF invoices/packing slips,
   * CSV exports) instead of the usual `{ success, data }` JSON envelope —
   * `request()`/`handleResponse()` always call `res.json()`, which would
   * throw on a real PDF/CSV response, so this is a separate, minimal path
   * that still attaches the same auth/shop headers and still ends the
   * session on a real 401 (a download can 401 exactly like any other
   * request; it must not be silently swallowed as "just try again").
   */
  public async getBlob(endpoint: string, params?: Record<string, any>): Promise<Blob> {
    const headers = this.getHeaders();
    const bearer = headers['Authorization'];
    const tokenSent = bearer ? bearer.replace(/^Bearer /, '') : null;

    let res: Response;
    try {
      res = await fetch(this.buildUrl(endpoint, params), { method: 'GET', headers });
    } catch {
      this.isConnected = false;
      throw new ApiError(NETWORK_ERROR_MESSAGE, { isNetworkError: true });
    }

    if (!res.ok) {
      if (res.status === 401 && tokenSent) {
        sessionManager.reportUnauthorized(tokenSent);
        throw new ApiError(SESSION_EXPIRED_MESSAGE, { status: 401, isAuthError: true });
      }
      let backendMessage: string | undefined;
      try {
        const body = await res.json();
        backendMessage = body?.message;
      } catch {
        // Not JSON — the generic message below is all we have.
      }
      throw new ApiError(backendMessage || `HTTP error ${res.status}: ${res.statusText}`, { status: res.status });
    }

    this.isConnected = true;
    return res.blob();
  }

  public post<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { body: body || {}, headers: extraHeaders });
  }

  public patch<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body: body || {}, headers: extraHeaders });
  }

  public put<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { body: body || {}, headers: extraHeaders });
  }

  // FormData bodies must NOT be JSON.stringify'd and must NOT carry an
  // explicit Content-Type — the browser sets `multipart/form-data;
  // boundary=...` itself only when Content-Type is left unset. Needed for
  // the theme builder's image-upload flows (Cloudinary via the backend's
  // /api/v1/uploads/* routes), which the JSON-only post() above can't serve.
  public postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { formData });
  }

  public deleteWithBody<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, { body: body || {} });
  }

  public delete<T>(endpoint: string, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, { headers: extraHeaders });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
