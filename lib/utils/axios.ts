import Axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getConfig, configureQuantumUI } from '../config';

// ---------------------------------------------------------------------------
// Module augmentation — custom options on every request
// ---------------------------------------------------------------------------

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Skip auth for public endpoints (login, signup, etc.) */
    public?: boolean;
    /** Skip redirect/event on 401 */
    skipAuthRedirect?: boolean;
    /** Show success feedback for mutations (default: true for POST/PUT/PATCH/DELETE) */
    showSuccessToast?: boolean;
    /** Show error feedback for errors (default: true) */
    showErrorToast?: boolean;
    /** Custom success message (overrides API response message) */
    successMessage?: string;
    /** Show loading feedback during request */
    loadingMessage?: string;
    /** Internal: toast/feedback ID for updates */
    _toastId?: string;
  }
}

// ---------------------------------------------------------------------------
// API error shape (RFC 9457)
// ---------------------------------------------------------------------------

interface ApiErrorResponse {
  title?: string;
  label?: string;
  status?: number;
  detail?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Optional toast/feedback adapter
// ---------------------------------------------------------------------------

export interface ToastAdapter {
  success(message: string, options?: { id?: string; description?: string; duration?: number }): void;
  error(message: string, options?: { id?: string; description?: string }): void;
  loading(message: string, options?: { id?: string }): string;
}

let _toast: ToastAdapter | null = null;

/** Register a toast/feedback adapter (e.g. react-native-toast-message wrapper). */
export function setToastAdapter(adapter: ToastAdapter): void {
  _toast = adapter;
}

function generateToastId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let sessionRecoveryPromise: Promise<boolean> | null = null;
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string | null> | null = null;

// ---------------------------------------------------------------------------
// Mobile Storage Adapter
// ---------------------------------------------------------------------------

export interface MobileStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

export interface MobileAxiosConfig {
  baseURL: string;
  auth?: {
    refreshEndpoint?: string;
  };
  storage: MobileStorageAdapter;
  onSessionExpired?: () => void;
}

let _storage: MobileStorageAdapter | null = null;
let _onSessionExpired: (() => void) | null = null;

const REFRESH_TOKEN_KEY = 'vritti_refresh_token';
const BASE_URL_KEY = 'vritti_api_base_url';
const DEPLOYMENT_BASE_URL_KEY = 'vritti_deployment_base_url';

interface MobileSessionResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

interface MobileLoginSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function syncAxiosDefaults(): void {
  const config = getConfig();

  axios.defaults.baseURL = config.axios.baseURL;
  axios.defaults.timeout = config.axios.timeout;
  axios.defaults.withCredentials = config.axios.withCredentials;

  if (config.axios.headers) {
    Object.assign(axios.defaults.headers.common, config.axios.headers);
  }
}

/**
 * Configure axios for mobile usage with secure token storage.
 * Call once at app startup before any API calls.
 */
export function configureMobileAxios(config: MobileAxiosConfig): void {
  _storage = config.storage;
  _onSessionExpired = config.onSessionExpired ?? _onSessionExpired;

  configureQuantumUI({
    axios: { baseURL: config.baseURL },
    auth: {
      refreshEndpoint: config.auth?.refreshEndpoint ?? 'auth/mobile/refresh-tokens',
      sessionRecoveryEnabled: false, // mobile uses stored refresh tokens, not cookies
    },
    csrf: { enabled: false }, // mobile doesn't use CSRF
    views: { viewsEndpoint: 'table-views', statesEndpoint: 'table-states' },
  });

  syncAxiosDefaults();
}

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

export const setToken = (token: string): void => {
  if (token && typeof token === 'string') {
    accessToken = token;
  }
};

export const getToken = (): string | null => accessToken;

export const clearToken = (): void => {
  accessToken = null;
  cancelTokenRefresh();
};

/** Store refresh token in secure storage (mobile) */
export async function storeRefreshToken(token: string): Promise<void> {
  if (_storage && token) {
    await _storage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/** Retrieve stored refresh token (mobile) */
export async function getRefreshToken(): Promise<string | null> {
  if (!_storage) return null;
  return _storage.getItem(REFRESH_TOKEN_KEY);
}

/** Clear all tokens (access + stored refresh) */
export async function clearTokens(): Promise<void> {
  clearToken();
  if (_storage) {
    await _storage.deleteItem(REFRESH_TOKEN_KEY);
  }
}

/** Get the session expired callback */
export function getOnSessionExpired(): (() => void) | null {
  return _onSessionExpired;
}

/** Persist and apply the active mobile API base URL. */
export async function setMobileBaseURL(baseURL: string): Promise<void> {
  if (!_storage) {
    throw new Error('Mobile axios storage is not configured');
  }

  configureMobileAxios({
    baseURL,
    auth: { refreshEndpoint: getConfig().auth.refreshEndpoint },
    storage: _storage,
  });
  await _storage.setItem(BASE_URL_KEY, baseURL);
}

/** Persist the selected deployment URL and use it for the pre-login flow. */
export async function setSelectedDeploymentBaseURL(baseURL: string): Promise<void> {
  if (!_storage) {
    throw new Error('Mobile axios storage is not configured');
  }

  configureMobileAxios({
    baseURL,
    auth: { refreshEndpoint: getConfig().auth.refreshEndpoint },
    storage: _storage,
  });
  await _storage.setItem(DEPLOYMENT_BASE_URL_KEY, baseURL);
}

/** Read the last selected mobile API base URL from secure storage. */
export async function getStoredMobileBaseURL(): Promise<string | null> {
  if (!_storage) return null;
  return _storage.getItem(BASE_URL_KEY);
}

/** Read the last selected deployment URL from secure storage. */
export async function getSelectedDeploymentBaseURL(): Promise<string | null> {
  if (!_storage) return null;
  return _storage.getItem(DEPLOYMENT_BASE_URL_KEY);
}

async function refreshMobileSession(options?: { notifyOnFailure?: boolean }): Promise<{ success: boolean; expiresIn: number }> {
  const notifyOnFailure = options?.notifyOnFailure ?? true;
  const config = getConfig();
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return { success: false, expiresIn: 0 };
  }

  try {
    const response = await Axios.post<MobileSessionResponse>(
      config.auth.refreshEndpoint,
      { refreshToken },
      {
        baseURL: config.axios.baseURL,
        timeout: config.axios.timeout,
        headers: config.axios.headers,
      },
    );

    if (response.data.accessToken) {
      setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        await storeRefreshToken(response.data.refreshToken);
      }
      return { success: true, expiresIn: response.data.expiresIn };
    }

    await clearTokens();
    if (notifyOnFailure) {
      _onSessionExpired?.();
    }
    return { success: false, expiresIn: 0 };
  } catch (error) {
    await clearTokens();
    if (notifyOnFailure) {
      if (Axios.isAxiosError(error) && error.response?.status === 401) {
        const data = error.response.data as ApiErrorResponse;
        _toast?.error(data?.label || data?.title || 'Session expired', {
          description: data?.detail,
        });
      }
      _onSessionExpired?.();
    }
    return { success: false, expiresIn: 0 };
  }
}

/**
 * Initialize the mobile HTTP/session runtime at app startup.
 * Restores the last selected base URL, then exchanges the stored refresh token
 * for a fresh in-memory access token.
 */
export async function initializeMobileSession(config: MobileAxiosConfig): Promise<boolean> {
  _storage = config.storage;

  const storedBaseURL = await _storage.getItem(BASE_URL_KEY);
  const effectiveBaseURL = storedBaseURL ?? config.baseURL;

  configureMobileAxios({
    ...config,
    baseURL: effectiveBaseURL,
  });

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const result = await refreshMobileSession({ notifyOnFailure: false });
  if (result.success) {
    scheduleTokenRefresh(result.expiresIn);
  }

  return result.success;
}

/** Store a successful mobile login and start proactive refresh scheduling. */
export async function completeMobileLoginSession(session: MobileLoginSession): Promise<void> {
  setToken(session.accessToken);
  await storeRefreshToken(session.refreshToken);
  scheduleTokenRefresh(session.expiresIn);
}

// ---------------------------------------------------------------------------
// CSRF Token Management
// ---------------------------------------------------------------------------

export const setCsrfToken = (token: string): void => {
  if (token && typeof token === 'string') {
    csrfToken = token;
  }
};

export const getCsrfToken = (): string | null => csrfToken;

export const clearCsrfToken = (): void => {
  csrfToken = null;
};

// ---------------------------------------------------------------------------
// Session Recovery & Refresh
// ---------------------------------------------------------------------------

export async function recoverToken(): Promise<{ success: boolean; expiresIn: number }> {
  const config = getConfig();

  try {
    const response = await Axios.get<{ accessToken: string; expiresIn: number }>(
      config.auth.tokenEndpoint,
      {
        baseURL: config.axios.baseURL,
        withCredentials: true,
        timeout: config.axios.timeout,
      },
    );

    if (response.data.accessToken) {
      setToken(response.data.accessToken);
      return { success: true, expiresIn: response.data.expiresIn };
    }

    return { success: false, expiresIn: 0 };
  } catch (error) {
    clearToken();
    if (Axios.isAxiosError(error) && error.response?.status === 401) {
      const data = error.response.data as ApiErrorResponse;
      _toast?.error(data?.label || data?.title || 'Session expired', {
        description: data?.detail,
      });
    }
    return { success: false, expiresIn: 0 };
  }
}

async function recoverTokenIfNeeded(): Promise<boolean> {
  const config = getConfig();
  if (!config.auth.sessionRecoveryEnabled) return true;
  if (accessToken) return true;

  if (sessionRecoveryPromise) return sessionRecoveryPromise;

  sessionRecoveryPromise = (async () => {
    try {
      const result = await recoverToken();
      if (result.success) {
        scheduleTokenRefresh(result.expiresIn);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      sessionRecoveryPromise = null;
    }
  })();

  return sessionRecoveryPromise;
}

export function scheduleTokenRefresh(expiresIn: number): void {
  cancelTokenRefresh();
  const refreshAt = expiresIn * 0.8 * 1000;

  refreshTimer = setTimeout(async () => {
    const result = await refreshMobileSession({ notifyOnFailure: true });
    if (result.success) {
      scheduleTokenRefresh(result.expiresIn);
    }
  }, refreshAt);
}

export function cancelTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// ---------------------------------------------------------------------------
// CSRF Token Fetching
// ---------------------------------------------------------------------------

async function fetchCsrfToken(): Promise<string | null> {
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = (async () => {
    try {
      const config = getConfig();
      if (!config.csrf.enabled) return null;

      const response = await Axios.get(config.csrf.endpoint, {
        baseURL: config.axios.baseURL,
        withCredentials: config.axios.withCredentials,
        timeout: config.axios.timeout,
      });

      const token = response.data?.csrfToken;
      if (token && typeof token === 'string') {
        setCsrfToken(token);
        return token;
      }
      return null;
    } catch {
      return null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

// ---------------------------------------------------------------------------
// Axios Instance & Interceptors
// ---------------------------------------------------------------------------

function createAxiosInstance(): AxiosInstance {
  const config = getConfig();
  return Axios.create({
    baseURL: config.axios.baseURL,
    withCredentials: config.axios.withCredentials,
    headers: config.axios.headers,
    timeout: config.axios.timeout,
  });
}

export const axios: AxiosInstance = createAxiosInstance();




// Request interceptor
axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const quantumConfig = getConfig();
  const isPublicRequest = (config as { public?: boolean }).public === true;

  // Auto-recover session for protected requests
  if (!isPublicRequest) {
    const hasSession = await recoverTokenIfNeeded();
    if (!hasSession) {
      return Promise.reject(new Error('No valid session'));
    }
  }

  // Add Authorization header
  const token = getToken();
  if (token) {
    config.headers[quantumConfig.auth.tokenHeaderName] =
      `${quantumConfig.auth.tokenPrefix} ${token}`;
  }

  // Custom request interceptor
  if (quantumConfig.axios.onRequest) {
    await quantumConfig.axios.onRequest(config);
  }

  // CSRF for state-changing requests
  const isStateChanging = ['post', 'put', 'patch', 'delete'].includes(
    config.method?.toLowerCase() || '',
  );

  if (isStateChanging && quantumConfig.csrf.enabled) {
    let csrf = getCsrfToken();
    if (!csrf) csrf = await fetchCsrfToken();
    if (csrf) config.headers[quantumConfig.csrf.headerName] = csrf;
  }

  // Loading feedback
  const loadingMessage = (config as { loadingMessage?: string }).loadingMessage;
  if (loadingMessage && _toast) {
    const toastId = generateToastId();
    (config as { _toastId?: string })._toastId = toastId;
    _toast.loading(loadingMessage, { id: toastId });
  }

  return config;
});

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    const config = response.config;
    const method = config.method?.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '');
    const toastId = (config as { _toastId?: string })._toastId;

    if (_toast) {
      if (toastId) {
        const message = config.successMessage || response.data?.message;
        _toast.success(message || 'Done', { id: toastId, duration: message ? undefined : 1000 });
      } else {
        const showSuccess = config.showSuccessToast ?? isMutation;
        if (showSuccess) {
          const message = config.successMessage || response.data?.message;
          if (message) _toast.success(message);
        }
      }
    }

    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config;
    const method = config?.method?.toUpperCase();
    const isGet = method === 'GET';
    const showError = isGet ? false : (config?.showErrorToast ?? true);
    const status = error.response?.status;
    const errorData = error.response?.data;
    const isPublicRequest = (config as { public?: boolean })?.public === true;
    const toastId = (config as { _toastId?: string })?._toastId;

    // 401 — clear session
    if (status === 401 && !isPublicRequest) {
      if (showError && _toast) {
        const title = errorData?.label || errorData?.title || 'Session expired';
        _toast.error(title, { id: toastId, description: errorData?.detail });
      }
      await clearTokens();
      _onSessionExpired?.();
      return Promise.reject(error);
    }

    if (_toast && showError) {
      // 5xx
      if (status && status >= 500) {
        const msg = errorData?.message || errorData?.detail || 'Something went wrong. Please try again.';
        _toast.error('Server Error', { id: toastId, description: msg });
      }

      // Network error
      if (!error.response && Axios.isAxiosError(error)) {
        _toast.error('Network Error', { id: toastId, description: 'Please check your internet connection.' });
      }

      // 4xx (non-401)
      if (status && status >= 400 && status < 500 && status !== 401) {
        const title = errorData?.label || errorData?.title || 'Request failed';
        _toast.error(title, { id: toastId, description: errorData?.detail });
      }
    }

    return Promise.reject(error);
  },
);

// Returns the configured axios instance
export function getAxios(): AxiosInstance {
  return axios;
}

// Adds a response interceptor that suppresses error toasts — returns the interceptor ID
export function suppressErrorToasts(axiosInstance: AxiosInstance): number {
  return axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.config) {
        (error.config as { showErrorToast?: boolean }).showErrorToast = false;
      }
      return Promise.reject(error);
    },
  );
}

// Removes a previously added suppress interceptor
export function restoreErrorToasts(axiosInstance: AxiosInstance, interceptorId: number): void {
  axiosInstance.interceptors.response.eject(interceptorId);
}

export default axios;
