export interface MobileStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

const REFRESH_TOKEN_KEY = 'vritti_refresh_token';
const BASE_URL_KEY = 'vritti_api_base_url';

let mobileStorage: MobileStorageAdapter | null = null;

export function setMobileStorageAdapter(storage: MobileStorageAdapter): void {
  mobileStorage = storage;
}

export function getMobileStorageAdapter(): MobileStorageAdapter | null {
  return mobileStorage;
}

export function requireMobileStorageAdapter(): MobileStorageAdapter {
  if (!mobileStorage) {
    throw new Error('Mobile axios storage is not configured');
  }

  return mobileStorage;
}

export async function writeRefreshToken(token: string): Promise<void> {
  if (!token) return;
  await requireMobileStorageAdapter().setItem(REFRESH_TOKEN_KEY, token);
}

export async function readRefreshToken(): Promise<string | null> {
  const storage = getMobileStorageAdapter();
  if (!storage) return null;
  return storage.getItem(REFRESH_TOKEN_KEY);
}

export async function deleteRefreshToken(): Promise<void> {
  const storage = getMobileStorageAdapter();
  if (!storage) return;
  await storage.deleteItem(REFRESH_TOKEN_KEY);
}

export async function writeStoredMobileBaseURL(baseURL: string): Promise<void> {
  await requireMobileStorageAdapter().setItem(BASE_URL_KEY, baseURL);
}

export async function readStoredMobileBaseURL(): Promise<string | null> {
  const storage = getMobileStorageAdapter();
  if (!storage) return null;
  return storage.getItem(BASE_URL_KEY);
}

