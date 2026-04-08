import type { AxiosInstance } from 'axios';

let axiosInstance: AxiosInstance | null = null;

// Stores the app's axios instance for Form error toast suppression
export function configureAxios(instance: AxiosInstance): void {
  axiosInstance = instance;
}

// Retrieves the stored axios instance
export function getAxios(): AxiosInstance | null {
  return axiosInstance;
}

// Adds interceptor to suppress error toasts during form submission
export function suppressErrorToasts(instance: AxiosInstance): number {
  return instance.interceptors.request.use((config) => ({
    ...config,
    showErrorToast: false,
  }));
}

// Removes the error toast suppression interceptor
export function restoreErrorToasts(instance: AxiosInstance, interceptorId: number): void {
  instance.interceptors.request.eject(interceptorId);
}
