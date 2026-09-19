import type { WorkspaceScope } from '../../context/PermissionGateContext';
import { ScreenContainer } from '../ScreenContainer';
import { type LockVariant, UpsellContent } from './UpsellContent';

export interface UpsellProps {
  /** Feature display name, e.g. "UOM". */
  featureName: string;
  /** Plan codes that unlock this feature (from feature.unlockPlans). */
  unlockPlans: string[];
  /** 'plan' (default) → amber upsell; 'workspace' → destructive "Not enabled for …". */
  variant?: LockVariant;
  workspaceLabel?: string | null;
  workspaceScope?: WorkspaceScope | null;
}

// Informational paywall rendered in place of a locked feature/screen — the native mirror of the web
// Upsell (apps/core-web/src/components/Upsell.tsx). The visuals live in UpsellContent (shared with
// UpsellSheetHost); this wrapper is the full-screen variant.
export function Upsell({ featureName, unlockPlans, variant, workspaceLabel, workspaceScope }: UpsellProps) {
  return (
    <ScreenContainer className="flex-1 items-center justify-center gap-8 p-6">
      <UpsellContent
        featureName={featureName}
        unlockPlans={unlockPlans}
        variant={variant}
        workspaceLabel={workspaceLabel}
        workspaceScope={workspaceScope}
      />
    </ScreenContainer>
  );
}
