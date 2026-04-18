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

export interface AxiosConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
  onRequest?: (config: import('axios').InternalAxiosRequestConfig) => void | Promise<void>;
}

export interface AuthConfig {
  tokenHeaderName: string;
  tokenPrefix: string;
  refreshEndpoint: string;
}

export interface ViewsConfig {
  viewsEndpoint: string;
  statesEndpoint: string;
}

export interface QuantumUIConfig {
  axios?: Partial<AxiosConfig>;
  auth?: Partial<AuthConfig>;
  views: ViewsConfig;
}

type ResolvedConfig = {
  axios: AxiosConfig;
  auth: AuthConfig;
  views: Required<ViewsConfig>;
};

const defaultConfig: ResolvedConfig = {
  axios: {
    baseURL: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
  auth: {
    tokenHeaderName: 'Authorization',
    tokenPrefix: 'Bearer',
    refreshEndpoint: 'auth/refresh-tokens',
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
