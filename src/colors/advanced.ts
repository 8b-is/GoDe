import tinycolor from 'tinycolor2';

export interface ColorHarmony {
    name: string;
    colors: string[];
}

export interface ColorGradient {
    stops: Array<{ color: string; position: number }>;
}

/**
 * Advanced color manipulation utilities for creative theme generation
 */
export class AdvancedColorOps {
    /**
     * Generate a complete color harmony scheme
     */
    public static generateHarmony(baseColor: string, type: 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary' | 'square'): ColorHarmony | null {
        const color = tinycolor(baseColor);
        if (!color.isValid()) return null;

        let colors: string[] = [];
        let name = '';

        switch (type) {
            case 'analogous':
                name = 'Analogous Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(30).toHexString(),
                    color.clone().spin(-30).toHexString(),
                    color.clone().spin(60).toHexString(),
                    color.clone().spin(-60).toHexString(),
                ];
                break;

            case 'complementary':
                name = 'Complementary Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(180).toHexString(),
                ];
                break;

            case 'triadic':
                name = 'Triadic Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(120).toHexString(),
                    color.clone().spin(240).toHexString(),
                ];
                break;

            case 'tetradic':
                name = 'Tetradic Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(90).toHexString(),
                    color.clone().spin(180).toHexString(),
                    color.clone().spin(270).toHexString(),
                ];
                break;

            case 'split-complementary':
                name = 'Split Complementary Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(150).toHexString(),
                    color.clone().spin(210).toHexString(),
                ];
                break;

            case 'square':
                name = 'Square Harmony';
                colors = [
                    color.toHexString(),
                    color.clone().spin(90).toHexString(),
                    color.clone().spin(180).toHexString(),
                    color.clone().spin(270).toHexString(),
                ];
                break;
        }

        return { name, colors };
    }

    /**
     * Generate a smooth gradient between colors
     */
    public static generateGradient(startColor: string, endColor: string, steps: number): string[] {
        const start = tinycolor(startColor);
        const end = tinycolor(endColor);

        if (!start.isValid() || !end.isValid() || steps < 2) {
            return [];
        }

        const gradient: string[] = [];
        for (let i = 0; i < steps; i++) {
            const amount = i / (steps - 1);
            const mixed = tinycolor.mix(start, end, amount * 100);
            gradient.push(mixed.toHexString());
        }

        return gradient;
    }

    /**
     * Generate monochromatic palette (tints and shades)
     */
    public static generateMonochromatic(baseColor: string, count: number = 9): string[] {
        const color = tinycolor(baseColor);
        if (!color.isValid()) return [];

        const palette: string[] = [];
        const step = 100 / (count - 1);

        for (let i = 0; i < count; i++) {
            const lightness = i * step;
            const hsl = color.toHsl();
            const variant = tinycolor({ h: hsl.h, s: hsl.s * 100, l: lightness });
            palette.push(variant.toHexString());
        }

        return palette;
    }

    /**
     * Create a tonal palette (varying saturation)
     */
    public static generateTonal(baseColor: string, count: number = 9): string[] {
        const color = tinycolor(baseColor);
        if (!color.isValid()) return [];

        const palette: string[] = [];
        const hsl = color.toHsl();
        const step = 100 / (count - 1);

        for (let i = 0; i < count; i++) {
            const saturation = i * step;
            const variant = tinycolor({ h: hsl.h, s: saturation, l: hsl.l * 100 });
            palette.push(variant.toHexString());
        }

        return palette;
    }

    /**
     * Generate a color scheme based on a mood/emotion
     */
    public static generateMoodPalette(mood: 'energetic' | 'calm' | 'warm' | 'cool' | 'vibrant' | 'muted' | 'dark' | 'light'): string[] {
        const palettes: Record<string, string[]> = {
            energetic: ['#ff6b35', '#f7931e', '#fdc830', '#37cfdc', '#8e44ad'],
            calm: ['#a8dadc', '#457b9d', '#1d3557', '#f1faee', '#e63946'],
            warm: ['#ff9a56', '#ff6b6b', '#ff4757', '#ffa502', '#ffd32a'],
            cool: ['#54a0ff', '#48dbfb', '#0abde3', '#00d2d3', '#1dd1a1'],
            vibrant: ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
            muted: ['#8d99ae', '#edf2f4', '#ef233c', '#d90429', '#2b2d42'],
            dark: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#000000'],
            light: ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da'],
        };

        return palettes[mood] || [];
    }

    /**
     * Blend multiple colors together
     */
    public static blendColors(colors: string[], mode: 'average' | 'multiply' | 'screen' = 'average'): string | null {
        if (colors.length === 0) return null;

        const validColors = colors.map(c => tinycolor(c)).filter(c => c.isValid());
        if (validColors.length === 0) return null;

        if (mode === 'average') {
            let r = 0, g = 0, b = 0;
            validColors.forEach(color => {
                const rgb = color.toRgb();
                r += rgb.r;
                g += rgb.g;
                b += rgb.b;
            });

            const count = validColors.length;
            return tinycolor({ r: r / count, g: g / count, b: b / count }).toHexString();
        } else if (mode === 'multiply') {
            let result = validColors[0];
            for (let i = 1; i < validColors.length; i++) {
                const rgb1 = result.toRgb();
                const rgb2 = validColors[i].toRgb();
                result = tinycolor({
                    r: (rgb1.r * rgb2.r) / 255,
                    g: (rgb1.g * rgb2.g) / 255,
                    b: (rgb1.b * rgb2.b) / 255,
                });
            }
            return result.toHexString();
        } else if (mode === 'screen') {
            let result = validColors[0];
            for (let i = 1; i < validColors.length; i++) {
                const rgb1 = result.toRgb();
                const rgb2 = validColors[i].toRgb();
                result = tinycolor({
                    r: 255 - ((255 - rgb1.r) * (255 - rgb2.r)) / 255,
                    g: 255 - ((255 - rgb1.g) * (255 - rgb2.g)) / 255,
                    b: 255 - ((255 - rgb1.b) * (255 - rgb2.b)) / 255,
                });
            }
            return result.toHexString();
        }

        return null;
    }

    /**
     * Adjust color temperature (warmer or cooler)
     */
    public static adjustTemperature(color: string, amount: number): string | null {
        const c = tinycolor(color);
        if (!c.isValid()) return null;

        // Positive amount = warmer (shift toward orange)
        // Negative amount = cooler (shift toward blue)
        const hsl = c.toHsl();
        let targetHue = hsl.h;

        if (amount > 0) {
            // Warm: shift toward orange (30°)
            targetHue = this.interpolateHue(hsl.h, 30, amount / 100);
        } else {
            // Cool: shift toward blue (210°)
            targetHue = this.interpolateHue(hsl.h, 210, Math.abs(amount) / 100);
        }

        return tinycolor({ h: targetHue, s: hsl.s * 100, l: hsl.l * 100 }).toHexString();
    }

    /**
     * Create a color from temperature in Kelvin (like blackbody radiation)
     */
    public static kelvinToColor(kelvin: number): string {
        // Clamp temperature
        kelvin = Math.max(1000, Math.min(40000, kelvin));
        const temp = kelvin / 100;

        let r, g, b;

        // Calculate red
        if (temp <= 66) {
            r = 255;
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        // Calculate green
        if (temp <= 66) {
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
        } else {
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
        }
        g = Math.max(0, Math.min(255, g));

        // Calculate blue
        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
            b = Math.max(0, Math.min(255, b));
        }

        return tinycolor({ r, g, b }).toHexString();
    }

    /**
     * Generate a perceptually uniform gradient
     */
    public static generatePerceptualGradient(startColor: string, endColor: string, steps: number): string[] {
        const start = tinycolor(startColor);
        const end = tinycolor(endColor);

        if (!start.isValid() || !end.isValid() || steps < 2) {
            return [];
        }

        const startLab = this.rgbToLab(start.toRgb());
        const endLab = this.rgbToLab(end.toRgb());

        const gradient: string[] = [];

        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            const lab = {
                l: startLab.l + (endLab.l - startLab.l) * t,
                a: startLab.a + (endLab.a - startLab.a) * t,
                b: startLab.b + (endLab.b - startLab.b) * t,
            };
            const rgb = this.labToRgb(lab);
            gradient.push(tinycolor(rgb).toHexString());
        }

        return gradient;
    }

    /**
     * Get color's perceived brightness (0-1)
     */
    public static getPerceivedBrightness(color: string): number {
        const c = tinycolor(color);
        if (!c.isValid()) return 0;

        const rgb = c.toRgb();
        // Use perceived luminance formula
        return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    }

    /**
     * Ensure color is readable against a background
     */
    public static ensureReadability(foreground: string, background: string, targetRatio: number = 4.5): string {
        const fg = tinycolor(foreground);
        const bg = tinycolor(background);

        if (!fg.isValid() || !bg.isValid()) return foreground;

        let attempts = 0;
        let current = fg.clone();

        while (attempts < 100) {
            const ratio = tinycolor.readability(current, bg);
            if (ratio >= targetRatio) {
                return current.toHexString();
            }

            // Adjust brightness
            if (this.getPerceivedBrightness(bg.toHexString()) > 0.5) {
                current = current.darken(5);
            } else {
                current = current.lighten(5);
            }

            attempts++;
        }

        return current.toHexString();
    }

    // Helper methods for LAB color space conversion
    private static rgbToLab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
        // Convert RGB to XYZ
        let r = rgb.r / 255;
        let g = rgb.g / 255;
        let b = rgb.b / 255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        return {
            l: (116 * y) - 16,
            a: 500 * (x - y),
            b: 200 * (y - z)
        };
    }

    private static labToRgb(lab: { l: number; a: number; b: number }): { r: number; g: number; b: number } {
        let y = (lab.l + 16) / 116;
        let x = lab.a / 500 + y;
        let z = y - lab.b / 200;

        x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
        y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
        z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

        let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b * 255)))
        };
    }

    private static interpolateHue(start: number, end: number, t: number): number {
        // Handle hue wrapping
        let diff = end - start;
        if (diff > 180) {
            diff -= 360;
        } else if (diff < -180) {
            diff += 360;
        }

        let result = start + diff * t;
        if (result < 0) result += 360;
        if (result >= 360) result -= 360;

        return result;
    }
}
