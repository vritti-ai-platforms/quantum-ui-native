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

export interface GraphqlConfig {
  httpEndpoint: string;
}

export interface ViewsConfig {
  viewsEndpoint: string;
  statesEndpoint: string;
}

export interface QuantumUIConfig {
  axios?: Partial<AxiosConfig>;
  auth?: Partial<AuthConfig>;
  graphql: GraphqlConfig;
  views: ViewsConfig;
}

type ResolvedConfig = {
  axios: AxiosConfig;
  auth: AuthConfig;
  graphql: GraphqlConfig;
  views: Required<ViewsConfig>;
};

const defaultConfig: Omit<ResolvedConfig, 'graphql'> = {
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

// No graphql default — configureQuantumUI must run before anything reads it. Reading first
// throws, which is the intended failure: a wrong endpoint is worse than a loud one.
let _config: ResolvedConfig | undefined;

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
    graphql: userConfig.graphql,
    views: { ...defaultConfig.views, ...(userConfig.views ?? {}) },
  };
}

export function getConfig(): ResolvedConfig {
  if (!_config) {
    throw new Error('quantum-ui-native is not configured — call configureQuantumUI() during bootstrap.');
  }
  return _config;
}

/**
 * Repoints the API base URL after configuration.
 *
 * The tenant's deployment URL is only known once it has been read from storage, which happens
 * after bootstrap. A targeted setter rather than re-running `configureQuantumUI`, which replaces
 * the whole object and would silently drop every other section.
 */
export function setAxiosBaseURL(baseURL: string): void {
  if (!_config) {
    throw new Error('quantum-ui-native is not configured — call configureQuantumUI() during bootstrap.');
  }
  _config.axios.baseURL = baseURL;
}

export function resetConfig(): void {
  _config = undefined;
}
