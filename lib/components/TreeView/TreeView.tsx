import { useUnstableNativeVariable } from 'nativewind';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '../../utils/index';
import { CardPressable } from '../CardPressable';
import { COMMON_ICONS, DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { Skeleton } from '../Skeleton';
import { Text } from '../Text';
import type { TreeDataItem, TreeViewProps } from './types';

// MF-shared theme var reader (same cast used by single-select / DateFieldTrigger). Returns the raw HSL
// triple (e.g. "210 75% 93%"), reactive to light/dark — used for the chevron adornment's tinted bg.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

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

// The children of `parentId` (or the root list when null). Used at drag-start to snapshot the group.
function findSiblings(nodes: TreeDataItem[], parentId: string | null): TreeDataItem[] | undefined {
  if (parentId === null) return nodes;
  for (const n of nodes) {
    if (n.id === parentId) return n.children ?? [];
    if (n.children?.length) {
      const found = findSiblings(n.children, parentId);
      if (found) return found;
    }
  }
  return undefined;
}

// Reorder `nodes` to match a committed id order; ids not in the order keep their original relative
// position (stable). Used to apply an optimistic order override on top of `data`.
function applyOrder(nodes: TreeDataItem[], order: string[]): TreeDataItem[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  return nodes
    .map((n, i) => ({ n, i }))
    .sort((a, b) => (rank.get(a.n.id) ?? order.length + a.i) - (rank.get(b.n.id) ?? order.length + b.i))
    .map((x) => x.n);
}

// Reanimated layout transitions drive the collapse reflow + sibling repositioning on the UI thread
// (unlike animating a `height` style each frame, which thrashes Fabric's layout and stutters).
// Separate open/close durations — close is slower — picked per the last toggle so the collapsing
// node and the siblings reflowing around it stay in sync.
const OPEN_DURATION = 300;
const CLOSE_DURATION = 460;
const OPEN_LAYOUT = LinearTransition.duration(OPEN_DURATION);
const CLOSE_LAYOUT = LinearTransition.duration(CLOSE_DURATION);
type LayoutProp = ComponentProps<typeof Animated.View>['layout'];

// Cap how many levels add indent + a guide line. Past this depth, deeper levels share the max indent
// (no extra indent / no new guide line) so cards never shrink off-screen on narrow widths — inline
// indentation can't scale to arbitrary depth on a phone. ~8 steps × ~20px ≈ 160px max indent; real
// trees rarely exceed this. Single tunable knob: lower it (or shrink the `2.5` step) for small phones.
const MAX_INDENT_DEPTH = 8;

// Drag-reorder geometry: row is h-14 (56) and the group's gap-1.5 (6) → a fixed pitch, so the drop
// index is just translationY / pitch (no per-row measurement). While a group is being reordered its
// nodes render collapsed (uniform height) and reflow via transforms on the UI thread — no per-move
// React re-render. Long-press to lift; the others shift one pitch to open the gap at the hovered slot.
// Keep this in sync with the row's `h-14` className below.
const ROW_PITCH = 56 + 6;
const LONG_PRESS_MS = 250;
const SHIFT_MS = 160;

// Built-in defaults (web-style) when the consumer passes no icons: nodes get a folder (closed) /
// open folder (open, yellow), leaves get a file. iOS SF Symbols has NO open-folder glyph (folder.fill
// is just the filled same-shape folder, so it reads as "same folder"), so the open state uses
// `tray.full.fill` — a genuinely open container — on iOS; Android gets the real `folder-open`.
const FOLDER: PlatformIconDescriptor = { sfSymbol: 'folder', materialSymbol: 'folder' };
const FOLDER_OPEN: PlatformIconDescriptor = { sfSymbol: 'folder.badge.plus', materialSymbol: 'folder_open' };
const FILE: PlatformIconDescriptor = { sfSymbol: 'doc', materialSymbol: 'description' };
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

type DraggableNodeProps = {
  index: number;
  count: number;
  parentKey: string;
  parentId: string | null;
  isActiveGroup: boolean;
  fromIndex: number;
  dragY: SharedValue<number>;
  overIndex: SharedValue<number>;
  layout: LayoutProp;
  beginDrag: (parentKey: string, parentId: string | null, index: number) => void;
  commitDrag: (from: number, over: number) => void;
  cancelDrag: () => void;
  children: ReactNode;
};

// One reorderable node. Owns its pan gesture (long-press to lift) + the drag transform. The gesture is
// memoized on stable inputs only, so the begin re-render (which flips `isActiveGroup`/`fromIndex`)
// does NOT recreate it mid-drag. The lifted row follows the finger; the others shift one pitch to open
// the gap at the hovered index — all on the UI thread via shared values.
function DraggableNode({
  index,
  count,
  parentKey,
  parentId,
  isActiveGroup,
  fromIndex,
  dragY,
  overIndex,
  layout,
  beginDrag,
  commitDrag,
  cancelDrag,
  children,
}: DraggableNodeProps) {
  const isDragRow = isActiveGroup && fromIndex === index;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          dragY.value = 0;
          overIndex.value = index;
          runOnJS(beginDrag)(parentKey, parentId, index);
        })
        .onChange((e) => {
          dragY.value = e.translationY;
          const next = Math.round(index + e.translationY / ROW_PITCH);
          overIndex.value = Math.min(count - 1, Math.max(0, next));
        })
        .onEnd(() => {
          runOnJS(commitDrag)(index, overIndex.value);
        })
        .onFinalize((_e, success) => {
          if (!success) {
            dragY.value = 0;
            overIndex.value = index;
            runOnJS(cancelDrag)();
          }
        }),
    [index, count, parentKey, parentId, dragY, overIndex, beginDrag, commitDrag, cancelDrag],
  );

  const animatedStyle = useAnimatedStyle(() => {
    // Every branch returns the SAME keys (transform [translateY, scale] + zIndex + elevation). Returning
    // {} or a shorter array would leave the lifted row's last transform stranded — Reanimated doesn't
    // reset properties that disappear between renders, which floated the dropped row out of its slot.
    if (!isActiveGroup) {
      return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0, elevation: 0 };
    }
    if (isDragRow) {
      return { transform: [{ translateY: dragY.value }, { scale: 1.03 }], zIndex: 50, elevation: 8 };
    }
    const over = overIndex.value;
    let shift = 0;
    if (fromIndex < over && index > fromIndex && index <= over) shift = -ROW_PITCH;
    else if (fromIndex > over && index >= over && index < fromIndex) shift = ROW_PITCH;
    return {
      transform: [{ translateY: withTiming(shift, { duration: SHIFT_MS }) }, { scale: 1 }],
      zIndex: 0,
      elevation: 0,
    };
  }, [isActiveGroup, isDragRow, fromIndex, index]);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View layout={layout} style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

type ActiveDrag = { parentKey: string; parentId: string | null; ids: string[]; draggingIndex: number };

// Single-selection tree. Mirrors the web TreeView: recursive nodes, expand/collapse with
// reveal-to-selection (auto-expand ancestors of the selected node), per-node icon variants, custom
// renderItem, actions, disabled nodes, loading skeleton, and long-press drag to reorder siblings
// within a parent (no reparenting — same as web). Pure RN + NativeWind + reanimated/gesture-handler.
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
  draggable = false,
  onReorder,
  className,
}: TreeViewProps) {
  const items = useMemo(() => (Array.isArray(data) ? data : [data]), [data]);

  // Background for the chevron adornment — the solid `--input` color so the block reads as clearly
  // different from the card surface (at 0.3 alpha it's ~invisible over the dark card). Read once here
  // (hook), used by the renderNodes closure for every node's adornment.
  const inputVar = useVar('--input');
  const adornmentBg = inputVar ? `hsl(${inputVar.split(' ').join(', ')})` : undefined;

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

  // --- drag reorder (single active drag at a time) ---
  const dragY = useSharedValue(0);
  const overIndex = useSharedValue(0);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  // After a drop we reorder the array; keep the just-committed group's layout transition suppressed
  // for one render so the rows snap into the new order instead of sliding from their old slots.
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  // Optimistic order overrides (parentKey -> ordered ids), applied on top of `data` at render so the
  // reorder feels instant; cleared when the consumer passes new `data` (their order then wins).
  const [orderOverrides, setOrderOverrides] = useState<Record<string, string[]>>({});

  // Refs so the commit/cancel callbacks stay stable (don't recreate the gesture) yet read fresh state.
  const activeDragRef = useRef<ActiveDrag | null>(activeDrag);
  activeDragRef.current = activeDrag;
  const onReorderRef = useRef<typeof onReorder>(onReorder);
  onReorderRef.current = onReorder;

  useEffect(() => {
    setOrderOverrides({});
  }, []);

  useEffect(() => {
    if (settlingKey === null) return;
    const id = setTimeout(() => setSettlingKey(null), 0);
    return () => clearTimeout(id);
  }, [settlingKey]);

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
  }, [expandAll, revealTargetId, items]);

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

  // Lift: snapshot the group's current (override-applied) order so the drop knows the move set.
  const beginDrag = useCallback(
    (parentKey: string, parentId: string | null, draggingIndex: number) => {
      const sibs = findSiblings(items, parentId) ?? [];
      const override = orderOverrides[parentKey];
      const ordered = override ? applyOrder(sibs, override) : sibs;
      setActiveDrag({ parentKey, parentId, ids: ordered.map((n) => n.id), draggingIndex });
    },
    [items, orderOverrides],
  );

  // Drop: if the slot changed, set the optimistic override + notify the consumer; then end the drag.
  const commitDrag = useCallback(
    (from: number, over: number) => {
      const a = activeDragRef.current;
      if (a) {
        if (from !== over) {
          const next = a.ids.slice();
          const [moved] = next.splice(from, 1);
          next.splice(over, 0, moved);
          setOrderOverrides((prev) => ({ ...prev, [a.parentKey]: next }));
          onReorderRef.current?.({ parentId: a.parentId, orderedIds: next });
        }
        setSettlingKey(a.parentKey);
      }
      setActiveDrag(null);
      dragY.value = 0;
      overIndex.value = 0;
    },
    [dragY, overIndex],
  );

  const cancelDrag = useCallback(() => {
    setActiveDrag(null);
  }, []);

  const renderNodes = (nodes: TreeDataItem[], level: number, parentId: string | null): ReactNode => {
    const parentKey = parentId ?? '__root__';
    const override = orderOverrides[parentKey];
    const ordered = override ? applyOrder(nodes, override) : nodes;
    // Web parity: reorderable only when enabled, ≥2 siblings, and none disabled / draggable:false.
    const groupReorderable =
      draggable && ordered.length >= 2 && ordered.every((n) => !n.disabled && n.draggable !== false);
    const inActiveGroup = activeDrag?.parentKey === parentKey;
    // Suppress the node-level layout transition while this group is dragging (rows reflow via
    // transforms instead) and for the one settling render after a drop (snap, don't slide).
    const nodeLayout: LayoutProp = inActiveGroup || settlingKey === parentKey ? undefined : layoutTransition;

    return (
      <View className="gap-1.5">
        {ordered.map((item, index) => {
          const hasChildren = !!item.children?.length;
          const isSelected = selectedItemId === item.id;
          // While its group is being reordered the node renders collapsed (uniform height for the
          // pitch math); the real expansion state is untouched and restored when the drag ends.
          const isOpen = expanded.has(item.id) && !inActiveGroup;
          const resolvedIcon = resolveNodeIcon(item, isSelected, isOpen, hasChildren, defaultNodeIcon, defaultLeafIcon);
          const tint = 'text-muted-foreground';

          const content = (
            <>
              <CardPressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: item.disabled,
                  selected: isSelected,
                  expanded: hasChildren ? isOpen : undefined,
                }}
                disabled={item.disabled}
                onPress={() => {
                  // Body press = select only; expand/collapse lives on the right chevron adornment.
                  if (item.disabled) return;
                  handleSelect(item);
                }}
                // Same card surface/shadow/elevation as the account screen (this is the component it uses).
                // h-14 (taller card, matches the Select-trigger reference) — keep ROW_PITCH in sync.
                className={cn('h-14 flex-row items-center px-3', item.className)}
              >
                <View className="flex-1 flex-row items-center">
                  {renderItem ? (
                    renderItem({
                      item,
                      level,
                      isLeaf: !hasChildren,
                      isSelected,
                      isOpen: hasChildren ? isOpen : undefined,
                      hasChildren,
                    })
                  ) : (
                    <>
                      {/* DynamicIcon ignores layout className (margin/size) — reserve width + gap on a sized wrapper.
                          `color` (set for the yellow open folder) overrides the className tint inside DynamicIcon. */}
                      <View className="mr-2.5 h-6 w-6 items-center justify-center">
                        <DynamicIcon icon={resolvedIcon.icon} size={16} className={tint} color={resolvedIcon.color} />
                      </View>
                      <Text numberOfLines={1} className="flex-1 text-base">
                        {item.name}
                      </Text>
                      {isSelected && item.actions ? <View className="ml-2">{item.actions}</View> : null}
                    </>
                  )}
                </View>
                {hasChildren ? (
                  // Separate press target: tapping this tinted circular icon button toggles expand/
                  // collapse (nested Pressables are mutually exclusive in RN, so the card body press
                  // won't fire). Compact 40px circle, vertically centered (parent is items-center) and
                  // inset from the edge (sits inside the card's px-3) — NOT full card height.
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    disabled={item.disabled}
                    onPress={() => {
                      if (!item.disabled) toggleExpand(item.id);
                    }}
                    hitSlop={6}
                    className="ml-2 h-10 w-10 items-center justify-center rounded-full"
                    // Plain-object style (NOT a function): NativeWind merges className into `style` as an
                    // array, and RN ignores a function nested in a style array — which silently dropped
                    // the backgroundColor. DateFieldTrigger uses this same plain-object + useVar pattern.
                    style={{ backgroundColor: adornmentBg }}
                  >
                    <DynamicIcon
                      icon={isOpen ? COMMON_ICONS.chevronUp : COMMON_ICONS.chevronDown}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </Pressable>
                ) : null}
              </CardPressable>
              {hasChildren ? (
                // Clipped container whose frame grows/shrinks via the layout transition → smooth reveal/
                // collapse on the UI thread. Children render only while open (collapsed subtrees aren't built).
                // The connector line lives HERE (on the animated frame), not on the inner content, so the
                // border's height IS the animated height — it rolls up/down in lockstep with the cards.
                // `nodeLayout` (not layoutTransition) so that when a drag collapses this group the empty
                // container snaps to 0 instead of shrinking over ~300ms (which would break the row pitch).
                <Animated.View
                  layout={nodeLayout}
                  // Indent + guide line only up to MAX_INDENT_DEPTH; deeper levels render flush so cards
                  // stay readable at any depth (the structural indent would otherwise accumulate forever).
                  className={cn(
                    'overflow-hidden',
                    level < MAX_INDENT_DEPTH && 'ml-2.5 border-l border-muted-foreground',
                  )}
                >
                  {isOpen || closing.has(item.id) ? (
                    // While closing (!isOpen) the subtree is absolutely positioned so it leaves the
                    // container's layout → the clipped container collapses around it (roll-up) in sync
                    // with the gap, instead of sliding out on its own timeline. The line→content gap is
                    // this view's OWN pl (not the parent's) so the absolute box matches the in-flow width —
                    // an absolute child's inset-x-0 ignores the parent's padding (Yoga measures from the
                    // padding box), which would otherwise widen/shift the cards mid-close.
                    <View
                      className={cn(
                        'mt-1.5',
                        level < MAX_INDENT_DEPTH && 'pl-2.5',
                        !isOpen && 'absolute inset-x-0 top-0',
                      )}
                    >
                      {renderNodes(item.children!, level + 1, item.id)}
                    </View>
                  ) : null}
                </Animated.View>
              ) : null}
            </>
          );

          if (groupReorderable) {
            return (
              <DraggableNode
                key={item.id}
                index={index}
                count={ordered.length}
                parentKey={parentKey}
                parentId={parentId}
                isActiveGroup={inActiveGroup}
                fromIndex={inActiveGroup ? (activeDrag?.draggingIndex ?? -1) : -1}
                dragY={dragY}
                overIndex={overIndex}
                layout={nodeLayout}
                beginDrag={beginDrag}
                commitDrag={commitDrag}
                cancelDrag={cancelDrag}
              >
                {content}
              </DraggableNode>
            );
          }

          // `layout` so this node slides smoothly when a sibling above it expands/collapses.
          return (
            <Animated.View key={item.id} layout={nodeLayout}>
              {content}
            </Animated.View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className={cn('gap-1.5', className)}>
        {Array.from({ length: loadingRowCount }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
            key={`tree-skeleton-${i}`}
            className={cn('h-14 rounded-md', i % 3 === 1 ? 'ml-3' : i % 3 === 2 ? 'ml-6' : '')}
          />
        ))}
      </View>
    );
  }

  return <View className={cn(className)}>{renderNodes(items, 0, null)}</View>;
}

TreeView.displayName = 'TreeView';
