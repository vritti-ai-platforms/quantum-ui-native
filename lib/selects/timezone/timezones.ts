import type { SelectOption } from '@vritti/quantum-ui-native/Select';

function getSupportedTimeZones(): string[] {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  if (typeof Intl !== 'undefined' && typeof intlWithSupportedValues.supportedValuesOf === 'function') {
    try {
      const timeZones = intlWithSupportedValues.supportedValuesOf('timeZone');
      if (timeZones.length > 0) {
        return timeZones.includes('UTC') ? timeZones : ['UTC', ...timeZones];
      }
    } catch {
      // no-op; falls back to UTC
    }
  }

  return ['UTC'];
}

export const TIMEZONES: SelectOption[] = getSupportedTimeZones().map((timeZone) => ({
  value: timeZone,
  label: timeZone,
}));
