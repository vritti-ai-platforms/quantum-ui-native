/**
 * quantum-ui-native Configuration System
 *
 * Mirrors lib/config/index.ts from @vritti/quantum-ui (web).
 * Uses a module-level variable instead of window (not available in React Native).
 *
 * @example
 * ```typescript
 * // In your app entry point (e.g. App.tsx)
 * import { configureQuantumUI } from '@vritti/quantum-ui-native';
 *
 * configureQuantumUI({
 *   axios: { baseURL: 'https://api.example.com' },
 *   views: { viewsEndpoint: 'table-views', statesEndpoint: 'table-states' },
 * });
 * ```
 */

export interface CsrfConfig {
  endpoint: string;
  enabled: boolean;
  headerName: string;
}

export interface AxiosConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
  headers?: Record<string, string>;
  onRequest?: (config: import('axios').InternalAxiosRequestConfig) => void | Promise<void>;
}

export interface AuthConfig {
  tokenHeaderName: string;
  tokenPrefix: string;
  tokenEndpoint: string;
  refreshEndpoint: string;
  sessionRecoveryEnabled: boolean;
}

export interface ViewsConfig {
  viewsEndpoint: string;
  statesEndpoint: string;
}

export interface QuantumUIConfig {
  csrf?: Partial<CsrfConfig>;
  axios?: Partial<AxiosConfig>;
  auth?: Partial<AuthConfig>;
  views: ViewsConfig;
}

type ResolvedConfig = {
  csrf: CsrfConfig;
  axios: AxiosConfig;
  auth: AuthConfig;
  views: Required<ViewsConfig>;
};

const defaultConfig: ResolvedConfig = {
  csrf: {
    endpoint: 'csrf/token',
    enabled: true,
    headerName: 'x-csrf-token',
  },
  axios: {
    baseURL: '/api',
    timeout: 30000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  auth: {
    tokenHeaderName: 'Authorization',
    tokenPrefix: 'Bearer',
    tokenEndpoint: 'auth/access-token',
    refreshEndpoint: 'auth/refresh-tokens',
    sessionRecoveryEnabled: true,
  },
  views: {
    viewsEndpoint: 'table-views',
    statesEndpoint: 'table-states',
  },
};

// Module-level singleton (replaces window.__QUANTUM_UI_CONFIG__ from the web version)
let _config: ResolvedConfig = { ...defaultConfig };

/** Type-safe config helper — define your config with full IntelliSense. */
export function defineConfig(config: QuantumUIConfig): QuantumUIConfig {
  return config;
}

/** Call once at app startup to configure the library. */
export function configureQuantumUI(userConfig: QuantumUIConfig): void {
  _config = {
    csrf: { ...defaultConfig.csrf, ...(userConfig.csrf ?? {}) },
    axios: {
      ...defaultConfig.axios,
      ...(userConfig.axios ?? {}),
      headers: {
        ...defaultConfig.axios.headers,
        ...(userConfig.axios?.headers ?? {}),
      },
    },
    auth: { ...defaultConfig.auth, ...(userConfig.auth ?? {}) },
    views: { ...defaultConfig.views, ...(userConfig.views ?? {}) },
  };
}

/** Read current merged configuration. */
export function getConfig(): ResolvedConfig {
  return _config;
}

/** Reset to defaults — useful in tests. */
export function resetConfig(): void {
  _config = { ...defaultConfig };
}
