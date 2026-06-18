export { ScreenContainer, type ScreenContainerProps } from './ScreenContainer';
// `useScreenHeaderInset` exposes the transparent ScreenHeader's expanded height (per route) so a
// custom scroller (e.g. a FlashList under a collapsing ScreenHeader) can pad its content the same
// way the scrollable ScreenContainer does internally.
export { getScreenScrollY, useScreenHeaderInset, useScreenScrollY } from './screenScrollRegistry';
// `useScreenSearch` shares the ScreenHeader's search field value with the screen body (per route).
export { type ScreenSearch, useScreenSearch } from './screenSearchRegistry';
