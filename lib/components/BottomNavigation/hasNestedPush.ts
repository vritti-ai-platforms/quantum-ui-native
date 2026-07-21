// Minimal structural shape of a react-navigation state tree node.
export type NestedNavState = {
  index?: number;
  routes?: Array<{ state?: NestedNavState }>;
};

// True when ANY navigator nested under the focused tab has pushed past its root. Feature tabs nest
// twice — tab → header-wrapper stack (makeScreen, always index 0) → the remote's own PushNavigator
// where detail pushes actually land — so a single-level `routes[index].state.index > 0` check never
// fires for them. Walk the focused chain instead (depth-capped against malformed/cyclic state).
export function hasNestedPush(state: NestedNavState | undefined): boolean {
  let cursor = state?.routes?.[state.index ?? 0]?.state;
  let guard = 0;
  while (cursor && guard < 10) {
    if (typeof cursor.index === 'number' && cursor.index > 0) return true;
    cursor = cursor.routes?.[cursor.index ?? 0]?.state;
    guard += 1;
  }
  return false;
}
