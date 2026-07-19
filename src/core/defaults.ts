import type { Profile } from './types';

export const CONTAINER_PRESETS = [24, 32, 40, 64];

export const DURATION_PRESETS = [
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '72h', hours: 72 },
];

export function defaultProfile(displayName: string): Omit<Profile, 'onboarded'> {
  return {
    displayName,
    weightLbs: 180,
    containerOz: 40,
    lmntFlavor: 'citrus',
    includeCoffee: true,
    rhythm: {
      wakeTime: '07:00',
      bedTime: '22:30',
      workBlocks: [],
      notes: '',
    },
    timeOverrides: {},
    createdAt: 0,
  };
}
