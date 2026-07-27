import type { AppSettings } from '@/types';

export interface ThemeSettings {
  siteTitle: string;
  primaryColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export const DEFAULT_THEME: ThemeSettings = {
  siteTitle: 'IT + Digital Roadmap',
  primaryColor: '#eab308',
  accentColor: '#3B82F6',
  gradientFrom: '#eab308',
  gradientTo: '#b45309',
};

export const buildThemeSettings = (
  entries: Array<Pick<AppSettings, 'key' | 'value'>>
): ThemeSettings => {
  const settings = { ...DEFAULT_THEME };
  for (const entry of entries) {
    if (entry.key in settings && typeof entry.value === 'string' && entry.value) {
      settings[entry.key as keyof ThemeSettings] = entry.value;
    }
  }
  return settings;
};
