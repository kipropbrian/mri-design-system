import * as React from "react";

/**
 * Subscribe to the mobile breakpoint.
 *
 * The preset's version sets state from inside an effect, which the React compiler
 * lint rejects (`react-hooks/set-state-in-effect`) and which costs a second render
 * on every mount. `useSyncExternalStore` is the primitive this is for: one render,
 * no effect, and an explicit server snapshot so the server and the first client
 * paint agree rather than hydrating a mismatch and correcting it.
 *
 * The server snapshot is `false` — assume desktop. Rendering expanded and then
 * collapsing is the same visible jump as the reverse, so the only question is which
 * is cheaper to be wrong about, and this is the branch that needs no restored state.
 */
const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
