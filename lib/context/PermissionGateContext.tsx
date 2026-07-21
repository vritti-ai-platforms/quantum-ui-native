import type React from 'react';
import { type Context, createContext, useContext } from 'react';

export type PermissionLockReason = 'PLAN' | 'SITE';

export interface PermissionGateResult {
  /** The user's role grants this permission (render axis). */
  granted: boolean;
  /** Granted but plan/site-locked (enable axis). */
  locked: boolean;
  reason: PermissionLockReason | null;
  /** Plan codes that unlock it (populated when reason is PLAN). */
  unlockPlans: string[];
  /** granted && !locked — fully usable. */
  available: boolean;
  /** Display name of the feature the code belongs to. */
  featureName: string | null;
}

/** Resolves a "[scope.]feature.permission" code against the host's live permission state. */
export type PermissionGateFn = (code: string) => PermissionGateResult;

// Fail-open result: no gate provider (or no code) must never block a screen or hide an action —
// the package can't assume every consuming app has a permission system.
const OPEN_RESULT: PermissionGateResult = {
  granted: true,
  locked: false,
  reason: null,
  unlockPlans: [],
  available: true,
  featureName: null,
};

// Module Federation: each bundle that imports this file would otherwise get its OWN `createContext()`
// instance, so the host's <PermissionGateProvider> would NOT connect to useContext inside a micro-app
// remote — the context objects differ by identity even though React is a shared singleton. Stash ONE
// context object on the globalThis-keyed map (same mechanism as FormatContext) so the host and every
// remote resolve to the identical instance.
const NAMED_CONTEXTS_KEY = '__quantum_ui_native_contexts';
type NamedContextsMap = Map<string, Context<unknown>>;
const namedContexts: NamedContextsMap =
  ((globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] as NamedContextsMap | undefined) ?? new Map();
(globalThis as Record<string, unknown>)[NAMED_CONTEXTS_KEY] = namedContexts;

export const PermissionGateContext: Context<PermissionGateFn | null> =
  (namedContexts.get('PermissionGateContext') as Context<PermissionGateFn | null> | undefined) ??
  (() => {
    const ctx = createContext<PermissionGateFn | null>(null);
    ctx.displayName = 'PermissionGateContext';
    namedContexts.set('PermissionGateContext', ctx as Context<unknown>);
    return ctx;
  })();

export interface PermissionGateProviderProps {
  gate: PermissionGateFn;
  children: React.ReactNode;
}

// The host (e.g. core-app's PermissionProvider) supplies its checkPermission gate; consumers —
// including Module Federation remotes' own bundled copies of quantum components — resolve it via
// usePermissionGate/usePermission because the context instance is shared through globalThis (above).
export function PermissionGateProvider({ gate, children }: PermissionGateProviderProps) {
  return <PermissionGateContext.Provider value={gate}>{children}</PermissionGateContext.Provider>;
}
PermissionGateProvider.displayName = 'PermissionGateProvider';

/** Raw gate access (null when no provider) — for callers that must distinguish "no gate" from "open". */
export function usePermissionGate(): PermissionGateFn | null {
  return useContext(PermissionGateContext);
}

/** Resolves one permission code, failing open when there is no gate or no code. */
export function usePermission(code?: string): PermissionGateResult {
  const gate = usePermissionGate();
  if (!gate || !code) return OPEN_RESULT;
  return gate(code);
}
