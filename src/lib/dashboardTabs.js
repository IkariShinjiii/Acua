// App.jsx's goToDashboardTab appends '#<n>' to the tab name to guarantee a
// distinct string on every call, even a repeat deep-link to the same tab —
// without that, React bails out of re-rendering on an unchanged prop value,
// and a dashboard view's effect watching initialTab would never re-fire.
// Shared by PatronDashboardView and AdminView, which both consume it.
export function parseDeepLinkTab(initialTab) {
  return initialTab?.split('#')[0];
}
