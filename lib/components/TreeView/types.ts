import type { ReactNode } from 'react';
import type { PlatformIconDescriptor } from '../DynamicIcon';

// Mirrors @vritti/quantum-ui's web TreeView API, RN-adapted: icons are PlatformIconDescriptors
// (sfSymbol/materialIcon) rendered via DynamicIcon, not lucide components.
export interface TreeDataItem {
  id: string;
  name: string;
  icon?: PlatformIconDescriptor;
  selectedIcon?: PlatformIconDescriptor;
  openIcon?: PlatformIconDescriptor;
  children?: TreeDataItem[];
  actions?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface TreeRenderItemParams {
  item: TreeDataItem;
  level: number;
  isLeaf: boolean;
  isSelected: boolean;
  isOpen?: boolean;
  hasChildren: boolean;
}

export interface TreeViewProps {
  data: TreeDataItem[] | TreeDataItem;
  isLoading?: boolean;
  /** Skeleton rows while loading (default 6). */
  loadingRowCount?: number;
  /** Uncontrolled initial selection. */
  initialSelectedItemId?: string;
  /** Controlled selection: when provided (string | null), the highlight follows this. `null` clears. */
  selectedItemId?: string | null;
  onSelectChange?: (item: TreeDataItem | undefined) => void;
  /** Expand every node. */
  expandAll?: boolean;
  /** Fallback icon for nodes (with children) when the item has no icon. */
  defaultNodeIcon?: PlatformIconDescriptor;
  /** Fallback icon for leaves when the item has no icon. */
  defaultLeafIcon?: PlatformIconDescriptor;
  /** Custom row renderer; the chevron (for nodes) is still appended on the right. */
  renderItem?: (params: TreeRenderItemParams) => ReactNode;
  className?: string;
}
