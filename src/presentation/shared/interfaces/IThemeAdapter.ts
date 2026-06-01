export type ThemePalette = {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
};

export interface IThemeAdapter {
  getColors(): ThemePalette;
  applyTheme(themeName: string): void;
}
