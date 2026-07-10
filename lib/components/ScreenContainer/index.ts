export { ScreenContainer, type ScreenContainerProps } from './ScreenContainer';
// `useScreenHeaderInset` exposes the transparent ScreenHeader's expanded height (per route) so a
// custom scroller (e.g. a FlashList under a collapsing ScreenHeader) can pad its content the same
// way the scrollable ScreenContainer does internally.
export { getScreenScrollY, useScreenHeaderInset, useScreenScrollY } from './screenScrollRegistry';
// `useScreenSearch` shares the ScreenHeader's search field value with the screen body (per route);
// `useDebouncedScreenSearch` returns that value debounced + trimmed (the standard for list/feed screens).
export { type ScreenSearch, useDebouncedScreenSearch, useScreenSearch } from './screenSearchRegistry';
// Bridges the ScreenHeader create (+) button ↔ the screen body's create handler (per route), like the search
// registry above. `useCreateEditSheet` (in /hooks) is the usual way a screen registers via this.
export { useRegisterScreenCreateAction, useScreenCreateAction } from './screenActionRegistry';
