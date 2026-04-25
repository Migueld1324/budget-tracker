import { describe, it, expect } from 'vitest';
import { getTheme } from './theme';

// Feature: budget-tracker, Property 25: Contraste de accesibilidad en temas
// **Validates: Requirements 14.6**

/**
 * Convert a hex color string to RGB components (0-255).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

/**
 * Linearize an sRGB channel value (0-255) to linear RGB.
 */
function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance per WCAG 2.x formula.
 */
function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate WCAG contrast ratio between two colors.
 * Returns a value >= 1 (lighter / darker).
 */
function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('Property 25: Contraste de accesibilidad en temas', () => {
  const WCAG_AA_MIN = 4.5;

  const textBgPairs = [
    { text: 'text.primary', bg: 'background.default' },
    { text: 'text.primary', bg: 'background.paper' },
    { text: 'text.secondary', bg: 'background.default' },
    { text: 'text.secondary', bg: 'background.paper' },
  ] as const;

  function getPaletteColor(
    palette: Record<string, any>,
    path: string,
  ): string {
    const [group, key] = path.split('.');
    return palette[group][key];
  }

  describe('Light theme', () => {
    const theme = getTheme('light');

    textBgPairs.forEach(({ text, bg }) => {
      it(`${text} on ${bg} has contrast ≥ ${WCAG_AA_MIN}:1`, () => {
        const textColor = getPaletteColor(theme.palette, text);
        const bgColor = getPaletteColor(theme.palette, bg);
        const ratio = contrastRatio(textColor, bgColor);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MIN);
      });
    });
  });

  describe('Dark theme', () => {
    const theme = getTheme('dark');

    textBgPairs.forEach(({ text, bg }) => {
      it(`${text} on ${bg} has contrast ≥ ${WCAG_AA_MIN}:1`, () => {
        const textColor = getPaletteColor(theme.palette, text);
        const bgColor = getPaletteColor(theme.palette, bg);
        const ratio = contrastRatio(textColor, bgColor);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_MIN);
      });
    });
  });
});
