import { Platform } from 'react-native';

type SupportedPlatform = typeof Platform.OS;

const normalizeVersion = (version: typeof Platform.Version): number => {
  if (typeof version === 'number') {
    return version;
  }

  const parsedVersion = Number.parseFloat(version);

  return Number.isFinite(parsedVersion) ? parsedVersion : 0;
};

export interface PlatformInfo {
  os: SupportedPlatform;
  version: number;
}

export const usePlatformInfo = (): PlatformInfo => {
  return {
    os: Platform.OS,
    version: normalizeVersion(Platform.Version),
  };
};
