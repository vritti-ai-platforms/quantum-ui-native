import { View } from 'react-native';
import { Badge } from '../Badge';
import { DynamicIcon } from '../DynamicIcon';
import { ScreenContainer } from '../ScreenContainer';
import { Text } from '../Text';

export interface UpsellProps {
  /** Feature display name, e.g. "UOM". */
  featureName: string;
  /** Plan codes that unlock this feature (from feature.unlockPlans). */
  unlockPlans: string[];
}

// Informational paywall rendered in place of a plan-locked feature — the native mirror of the web
// Upsell (apps/core-web/src/components/Upsell.tsx). Static by design: there is no billing/upgrade
// route to navigate to yet, so the "Plan upgrade" pill is a label, not a button.
export function Upsell({ featureName, unlockPlans }: UpsellProps) {
  const availability = unlockPlans.length
    ? `Available in ${unlockPlans.join(', ')}`
    : 'Not included in your plan';

  return (
    <ScreenContainer className="flex-1 items-center justify-center gap-8 p-6">
      {/* Medallion: wide ambient amber glow (absolute, centered by the wrapper's flex alignment) behind a
          thin ring, with a distinct glowing disc inside and a dark gap between disc and ring — per design.
          Amber opacity utilities + radial gradients render via the react-native-css color-mix patch. */}
      <View className="items-center justify-center">
        <View className="absolute size-80 rounded-full bg-radial from-warning/15 via-warning/5 to-transparent" />
        <View className="size-48 items-center justify-center rounded-full border border-warning/30">
          <View className="size-32 items-center justify-center rounded-full bg-radial from-warning/30 via-warning/15 to-warning/10">
            <DynamicIcon icon={{ sfSymbol: 'lock.fill', materialSymbol: 'lock' }} className="text-warning" size={32} />
          </View>
        </View>
      </View>

      <View className="items-center gap-3">
        <Badge variant="outline" className="gap-1.5 rounded-full border-warning bg-warning/10 px-3 py-1.5">
          <DynamicIcon
            icon={{ sfSymbol: 'sparkles', materialSymbol: 'auto_awesome' }}
            className="text-warning"
            size={14}
          />
          <Text className="text-sm font-semibold text-warning">Plan upgrade</Text>
        </Badge>

        <View className="items-center gap-1">
          <Text className="text-xl font-bold text-foreground">Unlock {featureName}</Text>
          <Text className="text-sm text-muted-foreground">{availability}</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
