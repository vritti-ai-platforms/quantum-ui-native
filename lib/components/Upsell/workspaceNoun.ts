import type { WorkspaceScope } from '../../context/PermissionGateContext';

// Names the workspace a lock sits on: its own name when the host resolved one, else the noun for its
// scope, else a neutral fallback. A lock may sit on the org, legal entity, site group or site, so the
// copy must never assume a site. Mirrors quantum-ui's workspaceNoun.
const SCOPE_NOUN: Record<WorkspaceScope, string> = {
  ORG: 'this organization',
  LE: 'this company',
  SITE_GROUP: 'this group',
  SITE: 'this outlet',
};

export function workspaceNoun(label: string | null, scope: WorkspaceScope | null): string {
  return label ?? (scope ? SCOPE_NOUN[scope] : 'this workspace');
}
