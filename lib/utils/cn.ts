import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merges Tailwind classes with conflict resolution
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
