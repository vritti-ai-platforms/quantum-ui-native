import Axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { configureQuantumUI, getConfig, type QuantumUIConfig, setAxiosBaseURL } from '../config';
import {
  deleteRefreshToken,
  type MobileStorageAdapter,
  readRefreshToken,
  readStoredMobileBaseURL,
  requireMobileStorageAdapter,
  setMobileStorageAdapter,
  writeRefreshToken,
  writeStoredMobileBaseURL,
} from './storage';

export type { MobileStorageAdapter } from './storage';

declare module 'axios' {
  export interface AxiosRequestConfig {
    public?: boolean;
    skipAuthRedirect?: boolean;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    loadingMessage?: string;
    _toastId?: string;
  }
}

interface ApiErrorResponse {
  title?: string;
  label?: string;
  status?: number;
  detail?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ToastAdapter {
  success(message: string, options?: { id?: string; description?: string; duration?: number }): void;
  error(message: string, options?: { id?: string; description?: string }): void;
  loading(message: string, options?: { id?: string }): string;
}

let _toast: ToastAdapter | null = null;

export function setToastAdapter(adapter: ToastAdapter): void {
  _toast = adapter;
}

function generateToastId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Everything quantum-ui-native needs, in one object applied by one call.
 *
 * The endpoints come from `QuantumUIConfig` so there is a single place an app declares them;
 * `storage` and `onSessionExpired` are the native-only additions.
 */
export type QuantumUINativeConfig = QuantumUIConfig & {
  storage: MobileStorageAdapter;
  onSessionExpired?: () => void;
};

let _onSessionExpired: (() => void) | null = null;

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

  if (config.axios.headers) {
    Object.assign(axios.defaults.headers.common, config.axios.headers);
  }
}

/**
 * The single configuration entry point. Call once during bootstrap, before anything else.
 *
 * One call rather than two: an earlier split let `configureMobileAxios` and `configureQuantumUI`
 * each replace the other's state depending on call order, which is not a thing an app should have
 * to know. Runtime changes go through the targeted setters below, never by reconfiguring.
 */
export function configureQuantumUINative(config: QuantumUINativeConfig): void {
  configureQuantumUI(config);
  setMobileStorageAdapter(config.storage);
  _onSessionExpired = config.onSessionExpired ?? _onSessionExpired;

  syncAxiosDefaults();
}

// Swaps the session-expired handler without touching the rest of the configuration
export function setOnSessionExpired(handler: () => void): void {
  _onSessionExpired = handler;
}

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

export async function storeRefreshToken(token: string): Promise<void> {
  await writeRefreshToken(token);
}

export async function getRefreshToken(): Promise<string | null> {
  return readRefreshToken();
}

export async function clearTokens(): Promise<void> {
  clearToken();
  await deleteRefreshToken();
}

export function getOnSessionExpired(): (() => void) | null {
  return _onSessionExpired;
}

// Points the app at a tenant's deployment and remembers it across launches
export async function setMobileBaseURL(baseURL: string): Promise<void> {
  requireMobileStorageAdapter();

  setAxiosBaseURL(baseURL);
  syncAxiosDefaults();
  await writeStoredMobileBaseURL(baseURL);
}

export async function getStoredMobileBaseURL(): Promise<string | null> {
  return readStoredMobileBaseURL();
}

async function refreshMobileSession(options?: {
  notifyOnFailure?: boolean;
}): Promise<{ success: boolean; expiresIn: number }> {
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

// Restores a stored session, repointing axios at the tenant's own deployment when one is stored
export async function initializeMobileSession(): Promise<boolean> {
  const storedBaseURL = await readStoredMobileBaseURL();
  if (storedBaseURL) {
    setAxiosBaseURL(storedBaseURL);
    syncAxiosDefaults();
  }

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

export async function completeMobileLoginSession(session: MobileLoginSession): Promise<void> {
  setToken(session.accessToken);
  await storeRefreshToken(session.refreshToken);
  scheduleTokenRefresh(session.expiresIn);
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

function buildMobileUserAgent(): string {
  const os = Platform.OS;
  const osVersion = Platform.Version;
  return `VAP/1.0 (${os === 'ios' ? 'iOS' : 'Android'} ${osVersion})`;
}

function createAxiosInstance(): AxiosInstance {
  const config = getConfig();
  return Axios.create({
    baseURL: config.axios.baseURL,
    headers: {
      ...config.axios.headers,
      'User-Agent': buildMobileUserAgent(),
    },
    timeout: config.axios.timeout,
  });
}

export const axios: AxiosInstance = createAxiosInstance();

axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const quantumConfig = getConfig();

  const token = getToken();
  if (token) {
    config.headers[quantumConfig.auth.tokenHeaderName] = `${quantumConfig.auth.tokenPrefix} ${token}`;
  }

  if (quantumConfig.axios.onRequest) {
    await quantumConfig.axios.onRequest(config);
  }

  const loadingMessage = (config as { loadingMessage?: string }).loadingMessage;
  if (loadingMessage && _toast) {
    const toastId = generateToastId();
    (config as { _toastId?: string })._toastId = toastId;
    _toast.loading(loadingMessage, { id: toastId });
  }

  return config;
});

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
      if (status && status >= 500) {
        const msg = errorData?.message || errorData?.detail || 'Something went wrong. Please try again.';
        _toast.error('Server Error', { id: toastId, description: msg });
      }

      if (!error.response && Axios.isAxiosError(error)) {
        _toast.error('Network Error', { id: toastId, description: 'Please check your internet connection.' });
      }

      if (status && status >= 400 && status < 500 && status !== 401) {
        const title = errorData?.label || errorData?.title || 'Request failed';
        _toast.error(title, { id: toastId, description: errorData?.detail });
      }
    }

    return Promise.reject(error);
  },
);

export function getAxios(): AxiosInstance {
  return axios;
}

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

export function restoreErrorToasts(axiosInstance: AxiosInstance, interceptorId: number): void {
  axiosInstance.interceptors.response.eject(interceptorId);
}

export default axios;
