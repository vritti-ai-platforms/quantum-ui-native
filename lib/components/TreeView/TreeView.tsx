import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { cn } from '../../utils/index';
import { CardPressable } from '../CardPressable';
import { COMMON_ICONS, DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { Skeleton } from '../Skeleton';
import { Text } from '../Text';
import type { TreeDataItem, TreeViewProps } from './types';

// --- tree walks (module-level, pure) -------------------------------------------------------------
function collectAllNodeIds(nodes: TreeDataItem[], out: Set<string>): void {
  for (const n of nodes) {
    if (n.children?.length) {
      out.add(n.id);
      collectAllNodeIds(n.children, out);
    }
  }
}

// Adds the ancestor ids on the path to `targetId` (excluding the target itself) — the "reveal" set.
function collectAncestors(nodes: TreeDataItem[], targetId: string, out: Set<string>, trail: string[] = []): boolean {
  for (const n of nodes) {
    if (n.id === targetId) {
      for (const id of trail) out.add(id);
      return true;
    }
    if (n.children?.length && collectAncestors(n.children, targetId, out, [...trail, n.id])) return true;
  }
  return false;
}

// Reanimated layout transitions drive the collapse reflow + sibling repositioning on the UI thread
// (unlike animating a `height` style each frame, which thrashes Fabric's layout and stutters).
// Separate open/close durations — close is slower — picked per the last toggle so the collapsing
// node and the siblings reflowing around it stay in sync.
const OPEN_DURATION = 300;
const CLOSE_DURATION = 460;
const OPEN_LAYOUT = LinearTransition.duration(OPEN_DURATION);
const CLOSE_LAYOUT = LinearTransition.duration(CLOSE_DURATION);

// Cap how many levels add indent + a guide line. Past this depth, deeper levels share the max indent
// (no extra indent / no new guide line) so cards never shrink off-screen on narrow widths — inline
// indentation can't scale to arbitrary depth on a phone. ~8 steps × ~20px ≈ 160px max indent; real
// trees rarely exceed this. Single tunable knob: lower it (or shrink the `2.5` step) for small phones.
const MAX_INDENT_DEPTH = 8;

// Built-in defaults (web-style) when the consumer passes no icons: nodes get a folder (closed) /
// open folder (open, yellow), leaves get a file. iOS SF Symbols has NO open-folder glyph (folder.fill
// is just the filled same-shape folder, so it reads as "same folder"), so the open state uses
// `tray.full.fill` — a genuinely open container — on iOS; Android gets the real `folder-open`.
const FOLDER: PlatformIconDescriptor = { sfSymbol: 'folder', materialIcon: 'folder' };
const FOLDER_OPEN: PlatformIconDescriptor = { sfSymbol: 'folder.badge.plus', materialIcon: 'folder-open' };
const FILE: PlatformIconDescriptor = { sfSymbol: 'doc', materialIcon: 'description' };
const FOLDER_OPEN_COLOR = '#EAB308'; // deliberate file-explorer folder-yellow (no yellow theme token)

// Icon precedence: per-node selected/open/icon → consumer default node/leaf → built-in folder/file.
// Returns an optional explicit `color` so the open folder is yellow regardless of selection.
const resolveNodeIcon = (
  item: TreeDataItem,
  isSelected: boolean,
  isOpen: boolean,
  hasChildren: boolean,
  defaultNodeIcon?: PlatformIconDescriptor,
  defaultLeafIcon?: PlatformIconDescriptor,
): { icon: PlatformIconDescriptor; color?: string } => {
  if (isSelected && item.selectedIcon) return { icon: item.selectedIcon };
  if (isOpen && item.openIcon) return { icon: item.openIcon };
  if (item.icon) return { icon: item.icon };
  if (hasChildren && defaultNodeIcon) return { icon: defaultNodeIcon };
  if (!hasChildren && defaultLeafIcon) return { icon: defaultLeafIcon };
  if (hasChildren) return isOpen ? { icon: FOLDER_OPEN, color: FOLDER_OPEN_COLOR } : { icon: FOLDER };
  return { icon: FILE };
};

// Single-selection tree. Mirrors the web TreeView: recursive nodes, expand/collapse with
// reveal-to-selection (auto-expand ancestors of the selected node), per-node icon variants, custom
// renderItem, actions, disabled nodes, loading skeleton. Pure RN + NativeWind (no DOM/Radix/dnd-kit);
// drag-reorder + virtualization are intentionally out of scope for now.
export function TreeView({
  data,
  isLoading = false,
  loadingRowCount = 6,
  initialSelectedItemId,
  selectedItemId: controlledSelectedItemId,
  onSelectChange,
  expandAll,
  defaultNodeIcon,
  defaultLeafIcon,
  renderItem,
  className,
}: TreeViewProps) {
  const items = Array.isArray(data) ? data : [data];

  const isControlled = controlledSelectedItemId !== undefined;
  const [internalSelected, setInternalSelected] = useState<string | undefined>(initialSelectedItemId);
  const selectedItemId = isControlled ? (controlledSelectedItemId ?? undefined) : internalSelected;
  const revealTargetId = isControlled ? selectedItemId : initialSelectedItemId;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // Drives the layout-transition duration so the close animates slower than the open.
  const [lastAction, setLastAction] = useState<'open' | 'close'>('open');
  const layoutTransition = lastAction === 'close' ? CLOSE_LAYOUT : OPEN_LAYOUT;
  // Ids mid-close: their subtree stays mounted (but detached from layout) so the clipped container
  // collapses OVER it — content rolls up in lockstep with the gap — then it's dropped after the close.
  const [closing, setClosing] = useState<Set<string>>(() => new Set());
  const closeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const timers = closeTimers.current;
    return () => {
      for (const t of Object.values(timers)) clearTimeout(t);
    };
  }, []);

  // Reveal-to-selection (additive — never force-collapses a node the user opened): expand all when
  // `expandAll`, else expand the ancestors of the current reveal target.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (expandAll) {
        collectAllNodeIds(items, next);
      } else if (revealTargetId) {
        collectAncestors(items, revealTargetId, next);
      }
      return next.size === prev.size ? prev : next;
    });
    // `items` is derived from `data`; depend on `data` to avoid an unstable array dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, expandAll, revealTargetId]);

  const handleSelect = (item: TreeDataItem) => {
    if (!isControlled) setInternalSelected(item.id);
    onSelectChange?.(item);
    item.onClick?.();
  };

  const toggleExpand = (id: string) => {
    const isOpenNow = expanded.has(id);
    setLastAction(isOpenNow ? 'close' : 'open');
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (isOpenNow) {
      // Keep the subtree rendered (detached) through the collapse, then drop it.
      setClosing((prev) => new Set(prev).add(id));
      clearTimeout(closeTimers.current[id]);
      closeTimers.current[id] = setTimeout(() => {
        setClosing((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        delete closeTimers.current[id];
      }, CLOSE_DURATION);
    } else if (closeTimers.current[id]) {
      // Re-opened before the close finished — cancel the pending drop.
      clearTimeout(closeTimers.current[id]);
      delete closeTimers.current[id];
      setClosing((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const renderNodes = (nodes: TreeDataItem[], level: number): ReactNode => (
    <View className="gap-1.5">
      {nodes.map((item) => {
        const hasChildren = !!item.children?.length;
        const isSelected = selectedItemId === item.id;
        const isOpen = expanded.has(item.id);
        const resolvedIcon = resolveNodeIcon(item, isSelected, isOpen, hasChildren, defaultNodeIcon, defaultLeafIcon);
        const tint = 'text-muted-foreground';

        return (
          // `layout` so this node slides smoothly when a sibling above it expands/collapses.
          <Animated.View key={item.id} layout={layoutTransition}>
            <CardPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: item.disabled, selected: isSelected, expanded: hasChildren ? isOpen : undefined }}
              disabled={item.disabled}
              onPress={() => {
                if (item.disabled) return;
                handleSelect(item);
                if (hasChildren) toggleExpand(item.id);
              }}
              // Same card surface/shadow/elevation as the account screen (this is the component it uses).
              className={cn('h-12 flex-row items-center px-3', item.className)}
            >
              <View className="flex-1 flex-row items-center">
                {renderItem ? (
                  renderItem({ item, level, isLeaf: !hasChildren, isSelected, isOpen: hasChildren ? isOpen : undefined, hasChildren })
                ) : (
                  <>
                    {/* DynamicIcon ignores layout className (margin/size) — reserve width + gap on a sized wrapper.
                        `color` (set for the yellow open folder) overrides the className tint inside DynamicIcon. */}
                    <View className="mr-2.5 h-6 w-6 items-center justify-center">
                      <DynamicIcon icon={resolvedIcon.icon} size={20} className={tint} color={resolvedIcon.color} />
                    </View>
                    <Text numberOfLines={1} className="flex-1 text-base">
                      {item.name}
                    </Text>
                    {isSelected && item.actions ? <View className="ml-2">{item.actions}</View> : null}
                  </>
                )}
              </View>
              {hasChildren ? (
                <View className="ml-2 h-6 w-6 items-center justify-center">
                  <DynamicIcon
                    icon={isOpen ? COMMON_ICONS.chevronDown : COMMON_ICONS.chevronRight}
                    size={20}
                    className="text-muted-foreground"
                  />
                </View>
              ) : null}
            </CardPressable>
            {hasChildren ? (
              // Clipped container whose frame grows/shrinks via the layout transition → smooth reveal/
              // collapse on the UI thread. Children render only while open (collapsed subtrees aren't built).
              // The connector line lives HERE (on the animated frame), not on the inner content, so the
              // border's height IS the animated height — it rolls up/down in lockstep with the cards.
              <Animated.View
                layout={layoutTransition}
                // Indent + guide line only up to MAX_INDENT_DEPTH; deeper levels render flush so cards
                // stay readable at any depth (the structural indent would otherwise accumulate forever).
                className={cn('overflow-hidden', level < MAX_INDENT_DEPTH && 'ml-2.5 border-l border-muted-foreground')}
              >
                {isOpen || closing.has(item.id) ? (
                  // While closing (!isOpen) the subtree is absolutely positioned so it leaves the
                  // container's layout → the clipped container collapses around it (roll-up) in sync
                  // with the gap, instead of sliding out on its own timeline. The line→content gap is
                  // this view's OWN pl (not the parent's) so the absolute box matches the in-flow width —
                  // an absolute child's inset-x-0 ignores the parent's padding (Yoga measures from the
                  // padding box), which would otherwise widen/shift the cards mid-close.
                  <View className={cn('mt-1.5', level < MAX_INDENT_DEPTH && 'pl-2.5', !isOpen && 'absolute inset-x-0 top-0')}>
                    {renderNodes(item.children!, level + 1)}
                  </View>
                ) : null}
              </Animated.View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );

  if (isLoading) {
    return (
      <View className={cn('gap-1.5', className)}>
        {Array.from({ length: loadingRowCount }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            key={`tree-skeleton-${i}`}
            className={cn('h-12 rounded-md', i % 3 === 1 ? 'ml-3' : i % 3 === 2 ? 'ml-6' : '')}
          />
        ))}
      </View>
    );
  }

  return <View className={cn(className)}>{renderNodes(items, 0)}</View>;
}

TreeView.displayName = 'TreeView';
