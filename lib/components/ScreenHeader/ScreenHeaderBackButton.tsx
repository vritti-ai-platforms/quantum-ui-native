import { useNavigation } from '@react-navigation/native';
import { Button } from '../Button';
import { COMMON_ICONS, DynamicIcon } from '../DynamicIcon';

// Built-in native-style header back button, rendered by ScreenHeader when `backButton` is set and no
// explicit `leftActions` are given — so screens don't re-implement a back button each time. DynamicIcon
// resolves the glyph per platform (chevron.left on iOS, arrow_back on Android); the Button resolves
// variant="glass" itself — liquid glass on iOS 26, ghost on pre-iOS 26 / Android — so no platform branch
// is needed here. Hidden when the stack can't pop.
export function ScreenHeaderBackButton() {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;
  return (
    <Button variant="glass" size="icon" onPress={() => navigation.goBack()} accessibilityLabel="Back" hitSlop={8}>
      <DynamicIcon icon={COMMON_ICONS.back} size={24} />
    </Button>
  );
}
