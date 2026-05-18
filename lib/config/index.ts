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

let _config: ResolvedConfig = { ...defaultConfig };

export function defineConfig(config: QuantumUIConfig): QuantumUIConfig {
  return config;
}

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

export function getConfig(): ResolvedConfig {
  return _config;
}

export function resetConfig(): void {
  _config = { ...defaultConfig };
}
