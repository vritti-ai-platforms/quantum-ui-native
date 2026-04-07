import { NitroModules } from 'react-native-nitro-modules';
import type { Yes } from './Yes.nitro';

const YesHybridObject =
  NitroModules.createHybridObject<Yes>('Yes');

export function multiply(a: number, b: number): number {
  return YesHybridObject.multiply(a, b);
}
