import tinycolor from 'tinycolor2';

/**
 * ColorManipulator provides a comprehensive suite of color manipulation utilities
 * for theme customization. Uses tinycolor2 for color math operations.
 *
 * @example
 * const manipulator = new ColorManipulator();
 * const darker = manipulator.adjustBrightness('#00ff00', -20); // Make 20% darker
 * const isAccessible = manipulator.meetsWCAGAA('#000000', '#ffffff'); // Check contrast
 */
export class ColorManipulator {
  /**
   * Adjust brightness of a color by percentage
   * @param color Hex color string (e.g., "#ff0000")
   * @param amount Percentage to adjust (-100 to 100)
   * @returns Adjusted hex color string
   *
   * @example
   * adjustBrightness('#00ff00', 20)  // Returns brighter green
   * adjustBrightness('#00ff00', -20) // Returns darker green
   */
  adjustBrightness(color: string, amount: number): string {
    const tc = tinycolor(color);
    if (amount > 0) {
      return tc.brighten(amount).toHexString();
    } else {
      return tc.darken(Math.abs(amount)).toHexString();
    }
  }

  /**
   * Adjust saturation of a color by percentage
   * @param color Hex color string
   * @param amount Percentage to adjust (-100 to 100)
   * @returns Adjusted hex color string
   *
   * @example
   * adjustSaturation('#00ff00', 20)  // More vibrant
   * adjustSaturation('#00ff00', -20) // More muted/grey
   */
  adjustSaturation(color: string, amount: number): string {
    const tc = tinycolor(color);
    if (amount > 0) {
      return tc.saturate(amount).toHexString();
    } else {
      return tc.desaturate(Math.abs(amount)).toHexString();
    }
  }

  /**
   * Shift hue by degrees on the color wheel
   * @param color Hex color string
   * @param degrees Degrees to rotate (-360 to 360)
   * @returns Color with shifted hue
   *
   * @example
   * shiftHue('#ff0000', 120) // Red -> Green
   * shiftHue('#ff0000', 240) // Red -> Blue
   */
  shiftHue(color: string, degrees: number): string {
    const tc = tinycolor(color);
    return tc.spin(degrees).toHexString();
  }

  /**
   * Get complementary color (opposite on color wheel)
   * @param color Hex color string
   * @returns Complementary hex color
   *
   * @example
   * getComplementary('#ff0000') // Returns cyan-ish color
   */
  getComplementary(color: string): string {
    return tinycolor(color).complement().toHexString();
  }

  /**
   * Get analogous colors (adjacent on color wheel)
   * Returns array of colors that work harmoniously together
   *
   * @param color Hex color string
   * @returns Array of 6 analogous hex colors
   *
   * @example
   * getAnalogous('#ff0000') // Returns array of red-orange-yellow shades
   */
  getAnalogous(color: string): string[] {
    return tinycolor(color).analogous().map(c => c.toHexString());
  }

  /**
   * Check if color is dark (luminance < 0.5)
   * Useful for deciding if text should be light or dark
   *
   * @param color Hex color string
   * @returns true if dark, false if light
   */
  isDark(color: string): boolean {
    return tinycolor(color).isDark();
  }

  /**
   * Check if color is light (luminance >= 0.5)
   *
   * @param color Hex color string
   * @returns true if light, false if dark
   */
  isLight(color: string): boolean {
    return tinycolor(color).isLight();
  }

  /**
   * Get luminance of a color (0-1 scale)
   * Used for contrast calculations
   *
   * @param color Hex color string
   * @returns Luminance value between 0 (black) and 1 (white)
   */
  getLuminance(color: string): number {
    return tinycolor(color).getLuminance();
  }

  /**
   * Calculate contrast ratio between two colors
   * Used for WCAG accessibility compliance checking
   *
   * @param color1 First hex color string
   * @param color2 Second hex color string
   * @returns Contrast ratio (1:1 to 21:1)
   *
   * @example
   * getContrastRatio('#000000', '#ffffff') // Returns 21 (maximum contrast)
   * getContrastRatio('#000000', '#111111') // Returns ~1.2 (very low contrast)
   */
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
   * This is the minimum recommended contrast for body text
   *
   * @param foreground Text color hex string
   * @param background Background color hex string
   * @returns true if meets AA standard
   */
  meetsWCAGAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5;
  }

  /**
   * Check if contrast meets WCAG AAA standard (7:1 for normal text)
   * This is the enhanced contrast level for better accessibility
   *
   * @param foreground Text color hex string
   * @param background Background color hex string
   * @returns true if meets AAA standard
   */
  meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7.0;
  }

  /**
   * Mix two colors together
   *
   * @param color1 First hex color string
   * @param color2 Second hex color string
   * @param amount Percentage of color2 (0-100, default 50)
   * @returns Mixed hex color string
   *
   * @example
   * mix('#ff0000', '#0000ff', 50) // Returns purple (50% red, 50% blue)
   * mix('#ff0000', '#0000ff', 25) // Returns red-ish purple (75% red, 25% blue)
   */
  mix(color1: string, color2: string, amount: number = 50): string {
    return tinycolor.mix(color1, color2, amount).toHexString();
  }

  /**
   * Convert color to RGB string format
   * Useful for CSS rgba() values
   *
   * @param color Hex color string
   * @returns RGB string (e.g., "rgb(255, 0, 0)")
   */
  toRgbString(color: string): string {
    return tinycolor(color).toRgbString();
  }

  /**
   * Validate if string is a valid color
   * Supports hex, rgb, rgba, hsl, hsla, named colors
   *
   * @param color Color string to validate
   * @returns true if valid color, false otherwise
   *
   * @example
   * isValidColor('#ff0000')     // true
   * isValidColor('red')         // true
   * isValidColor('rgb(255,0,0)') // true
   * isValidColor('invalid')     // false
   */
  isValidColor(color: string): boolean {
    return tinycolor(color).isValid();
  }
}
