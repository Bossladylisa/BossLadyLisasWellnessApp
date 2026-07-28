// Colors is a legacy static export. New pages should use `useTheme()` from '../store/useTheme'.
// This file re-exports the default (sunset) theme for backward compat, but the actual
// runtime colors flow through useTheme() where the component subscribes to theme changes.
import { THEMES } from './themes';

export const Colors = THEMES.sunset;

export const Fonts = {
  serif: 'serif',
  sans: 'System',
};
