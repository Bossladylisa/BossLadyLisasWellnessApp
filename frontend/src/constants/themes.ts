export interface Theme {
  name: string;
  emoji: string;
  description: string;
  teal: string;         // Primary background (dark)
  tealMid: string;      // Secondary/gradient midpoint
  gradientColors: [string, string, string, string]; // 4-stop gradient for home background
  terra: string;        // Warm accent primary
  terraLt: string;      // Warm accent light
  terraDk: string;      // Warm accent dark
  gold: string;         // Highlight primary
  goldLt: string;       // Highlight light
  cream: string;        // Text primary
  glass: string;        // Glass background
  glassBdr: string;     // Glass border
}

export const THEMES: Record<string, Theme> = {
  sunset: {
    name: 'Sunset Warmth',
    emoji: '🌅',
    description: 'Warm plum, coral & gold',
    teal: '#2d1b3d',
    tealMid: '#4a2c5a',
    gradientColors: ['#2d1b3d', '#4a2c5a', '#5a3548', '#A0421F'],
    terra: '#D97545',
    terraLt: '#F19660',
    terraDk: '#A0421F',
    gold: '#E8B84D',
    goldLt: '#F5D178',
    cream: '#FCF3DC',
    glass: 'rgba(255,255,255,0.08)',
    glassBdr: 'rgba(232,184,77,0.28)',
  },
  ocean: {
    name: 'Ocean Depths',
    emoji: '🌊',
    description: 'Deep teal, aqua & silver',
    teal: '#0d2438',
    tealMid: '#1a3d5c',
    gradientColors: ['#0d2438', '#1a3d5c', '#245a7a', '#3a8a9e'],
    terra: '#5eb3c9',
    terraLt: '#8ad1e0',
    terraDk: '#2c6e8a',
    gold: '#c9d9e8',
    goldLt: '#e8f0f7',
    cream: '#f0f7fa',
    glass: 'rgba(255,255,255,0.08)',
    glassBdr: 'rgba(138,209,224,0.28)',
  },
  forest: {
    name: 'Forest Sanctuary',
    emoji: '🌲',
    description: 'Deep forest, moss & copper',
    teal: '#1a2d1a',
    tealMid: '#2d4a30',
    gradientColors: ['#1a2d1a', '#2d4a30', '#3d5c30', '#7a6a1a'],
    terra: '#a87848',
    terraLt: '#c9955a',
    terraDk: '#6b4820',
    gold: '#c9b06a',
    goldLt: '#e0cc85',
    cream: '#f2ecd8',
    glass: 'rgba(255,255,255,0.08)',
    glassBdr: 'rgba(201,176,106,0.28)',
  },
  midnight: {
    name: 'Midnight Sacred',
    emoji: '🌙',
    description: 'Deep navy, silver & gold',
    teal: '#0a0e2a',
    tealMid: '#1a1f3d',
    gradientColors: ['#0a0e2a', '#1a1f3d', '#2a2d4d', '#4d3a5c'],
    terra: '#b088b8',
    terraLt: '#d0aad8',
    terraDk: '#6b4d78',
    gold: '#d4b56a',
    goldLt: '#f0d78a',
    cream: '#e8e4f5',
    glass: 'rgba(255,255,255,0.08)',
    glassBdr: 'rgba(212,181,106,0.3)',
  },
};

export type ThemeKey = keyof typeof THEMES;
