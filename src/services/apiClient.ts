import { ScopeLocation, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4500';

const ACTIVE_SHOP_STORAGE_KEY = 'mc_active_shop_id';

// Module-level so it's readable from `getHeaders()` without threading a shop
// id through every service call — the Shop Switcher (`ShopScopeContext`)
// is the only writer. Initialized synchronously from localStorage since the
// ApiClient singleton is constructed before React mounts.
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

  private getAuthToken(): string | null {
    return localStorage.getItem('mc_access_token');
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const token = this.getAuthToken();
    const role = (localStorage.getItem('mc_role') as UserRole) || 'HQ Admin';
    const scope = (localStorage.getItem('mc_scope') as ScopeLocation) || 'All Hubs (HQ Global)';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Role-Scope': role,
      'X-Warehouse-Scope': scope,
      ...(activeShopId ? { 'X-Shop-Id': activeShopId } : {}),
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      this.isConnected = false;
      throw new Error(`API endpoint returned HTML instead of JSON. Ensure VITE_API_BASE_URL points to the backend server (http://localhost:4500).`);
    }

    if (!res.ok) {
      // The backend always sends a real, useful `message` in its JSON error
      // body (e.g. "Wallet balance limit exceeded") — read it instead of
      // discarding it in favor of the generic HTTP status text, which is
      // rarely more informative than "Bad Request".
      let backendMessage: string | undefined;
      try {
        const body = await res.json();
        backendMessage = body?.message;
      } catch {
        // Body wasn't JSON (or was empty) — fall through to the generic message.
      }
      this.isConnected = true;
      throw new Error(backendMessage || `HTTP error ${res.status}: ${res.statusText}`);
    }

    this.isConnected = true;
    return await res.json();
  }

  public async get<T>(endpoint: string, params?: Record<string, any>, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
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

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(extraHeaders),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API GET] ${endpoint} (${this.baseUrl}) — request failed; backend offline or misconfigured.`);
      throw error;
    }
  }

  public async post<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(extraHeaders),
        body: JSON.stringify(body || {}),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API POST] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }

  public async patch<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(extraHeaders),
        body: JSON.stringify(body || {}),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API PATCH] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }

  public async put<T>(endpoint: string, body: any = {}, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(extraHeaders),
        body: JSON.stringify(body || {}),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API PUT] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }

  // FormData bodies must NOT be JSON.stringify'd and must NOT carry an
  // explicit Content-Type — the browser sets `multipart/form-data;
  // boundary=...` itself only when Content-Type is left unset. Needed for
  // the theme builder's image-upload flows (Cloudinary via the backend's
  // /api/v1/uploads/* routes), which the JSON-only post() above can't serve.
  public async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const headers = this.getHeaders();
    delete headers['Content-Type'];

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API POST FormData] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }

  public async deleteWithBody<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify(body || {}),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API DELETE] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }

  public async delete<T>(endpoint: string, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(extraHeaders),
      });

      return await this.handleResponse<T>(res);
    } catch (error) {
      this.isConnected = false;
      console.warn(`[API DELETE] ${endpoint} (${this.baseUrl}) error:`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
