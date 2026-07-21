import { View } from 'react-native';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { DynamicIcon } from '../DynamicIcon';
import { Text } from '../Text';

/** Lock treatment theme: 'plan' = amber + upsell copy; 'site' = destructive + "Not enabled for this site". */
export type LockVariant = 'plan' | 'site';

export interface UpsellContentProps {
  /** Feature display name, e.g. "UOM". */
  featureName: string;
  /** Plan codes that unlock this feature (from feature.unlockPlans / the permission gate). */
  unlockPlans: string[];
  /** Visual scale: 'default' for the full-screen paywall, 'sm' for the bottom sheet. */
  size?: 'default' | 'sm';
  /** 'plan' (default) → amber medallion + upsell; 'site' → destructive medallion + "Not enabled for this site". */
  variant?: LockVariant;
}

// Full gradient class strings per variant × size — react-native-css needs contiguous gradient literals
// (NativeWind can't compose `from-*`/`via-*`/`to-*` dynamically), so each combination is a literal string.
// sm runs stronger stops (the default peaks read as no glow over the smaller radius). Stop POSITIONS matter:
// the radial ray ends at the farthest CORNER, so to-transparent at 70% zeroes the alpha before the edges
// (edge midpoints sit at ~70.7% of the ray) — the glow dissolves with no visible square/circle shape.
const GLOW = {
  plan: {
    sm: 'absolute size-64 bg-radial from-warning/25 via-warning/10 via-35% to-transparent to-70%',
    default: 'absolute size-80 bg-radial from-warning/15 via-warning/5 via-35% to-transparent to-70%',
  },
  site: {
    sm: 'absolute size-64 bg-radial from-destructive/25 via-destructive/10 via-35% to-transparent to-70%',
    default: 'absolute size-80 bg-radial from-destructive/15 via-destructive/5 via-35% to-transparent to-70%',
  },
} as const;

const DISC = {
  plan: {
    sm: 'size-20 items-center justify-center rounded-full bg-radial from-warning/40 via-warning/25 to-warning/15',
    default: 'size-32 items-center justify-center rounded-full bg-radial from-warning/30 via-warning/15 to-warning/10',
  },
  site: {
    sm: 'size-20 items-center justify-center rounded-full bg-radial from-destructive/40 via-destructive/25 to-destructive/15',
    default: 'size-32 items-center justify-center rounded-full bg-radial from-destructive/30 via-destructive/15 to-destructive/10',
  },
} as const;

// The shared lock visuals (lock medallion + copy). variant 'plan' → amber, "Plan upgrade" pill,
// "Unlock {name}", availability. variant 'site' → destructive medallion + "Not enabled for this site"
// (no pill / no availability — a plan upgrade can't lift a site lock). Container-agnostic: the full-screen
// Upsell wraps it in ScreenContainer; UpsellSheetHost wraps it in bottom-sheet padding.
export function UpsellContent({ featureName, unlockPlans, size = 'default', variant = 'plan' }: UpsellContentProps) {
  const sm = size === 'sm';
  const key = sm ? 'sm' : 'default';
  const isSite = variant === 'site';
  const accentText = isSite ? 'text-destructive' : 'text-warning';
  const availability = unlockPlans.length ? `Available in ${unlockPlans.join(', ')}` : 'Not included in your plan';

  return (
    <>
      {/* Medallion: wide ambient glow behind a thin ring, with a glowing disc inside and a dark gap between
          disc and ring. Amber (plan) or destructive (site) per variant — see GLOW/DISC. */}
      <View className="items-center justify-center">
        <View className={GLOW[variant][key]} />
        <View
          className={cn(
            'items-center justify-center rounded-full border',
            sm ? 'size-32' : 'size-48',
            isSite ? 'border-destructive/30' : 'border-warning/30',
          )}
        >
          <View className={DISC[variant][key]}>
            <DynamicIcon icon={{ sfSymbol: 'lock.fill', materialSymbol: 'lock' }} className={accentText} size={sm ? 24 : 32} />
          </View>
        </View>
      </View>

      <View className={sm ? 'items-center gap-2' : 'items-center gap-3'}>
        {isSite ? null : (
          <Badge variant="outline" className="gap-1.5 rounded-full border-warning bg-warning/10 px-3 py-1.5">
            <DynamicIcon icon={{ sfSymbol: 'sparkles', materialSymbol: 'auto_awesome' }} className="text-warning" size={14} />
            <Text className="text-sm font-semibold text-warning">Plan upgrade</Text>
          </Badge>
        )}

        <View className="items-center gap-1">
          <Text className={sm ? 'text-lg font-bold text-foreground' : 'text-xl font-bold text-foreground'}>
            {isSite ? 'Not enabled for this site' : `Unlock ${featureName}`}
          </Text>
          {isSite ? null : <Text className="text-sm text-muted-foreground">{availability}</Text>}
        </View>
      </View>
    </>
  );
}
