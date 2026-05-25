import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
}
