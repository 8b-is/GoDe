import * as vscode from 'vscode';

export type EffectType =
    | 'matrix-rain'
    | 'particles'
    | 'glitch'
    | 'neon-pulse'
    | 'code-rain'
    | 'starfield'
    | 'plasma'
    | 'wave';

export interface EffectOptions {
    intensity?: number; // 0-100
    speed?: number; // 0-100
    colors?: string[];
    duration?: number; // milliseconds, 0 = infinite
}

/**
 * Visual Effects Controller - Create awesome visual effects in VSCode
 */
export class VisualEffectsController {
    private activeEffects: Map<string, NodeJS.Timeout> = new Map();
    private config = vscode.workspace.getConfiguration('workbench');

    /**
     * Start a visual effect
     */
    async startEffect(effect: EffectType, options: EffectOptions = {}): Promise<string> {
        const effectId = `${effect}-${Date.now()}`;

        switch (effect) {
            case 'matrix-rain':
                await this.matrixRain(effectId, options);
                break;
            case 'neon-pulse':
                await this.neonPulse(effectId, options);
                break;
            case 'glitch':
                await this.glitchEffect(effectId, options);
                break;
            case 'particles':
                await this.particles(effectId, options);
                break;
            case 'code-rain':
                await this.codeRain(effectId, options);
                break;
            case 'starfield':
                await this.starfield(effectId, options);
                break;
            case 'plasma':
                await this.plasma(effectId, options);
                break;
            case 'wave':
                await this.wave(effectId, options);
                break;
        }

        return effectId;
    }

    /**
     * Stop an effect
     */
    stopEffect(effectId: string): void {
        const timer = this.activeEffects.get(effectId);
        if (timer) {
            clearInterval(timer);
            this.activeEffects.delete(effectId);
        }
    }

    /**
     * Stop all effects
     */
    stopAllEffects(): void {
        for (const [id] of this.activeEffects) {
            this.stopEffect(id);
        }
    }

    /**
     * Matrix rain effect - cycling through green colors
     */
    private async matrixRain(effectId: string, options: EffectOptions): Promise<void> {
        const intensity = options.intensity ?? 50;
        const speed = options.speed ?? 50;
        const duration = options.duration ?? 0;

        const colors = [
            '#001100', '#003300', '#005500', '#007700', '#009900',
            '#00bb00', '#00dd00', '#00ff00'
        ];

        let index = 0;
        const interval = setInterval(async () => {
            const color = colors[index % colors.length];
            await this.setEditorBackground(color, intensity);
            index++;
        }, 200 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Neon pulse effect - pulsating neon colors
     */
    private async neonPulse(effectId: string, options: EffectOptions): Promise<void> {
        const colors = options.colors ?? [
            '#ff00ff', '#00ffff', '#ff0080', '#8000ff', '#00ff80'
        ];
        const speed = options.speed ?? 50;
        const duration = options.duration ?? 0;

        let index = 0;
        let brightness = 0;
        let direction = 1;

        const interval = setInterval(async () => {
            const color = colors[index % colors.length];
            const alpha = (brightness / 100).toFixed(2);

            // Pulse brightness
            brightness += direction * 5;
            if (brightness >= 100) {
                brightness = 100;
                direction = -1;
                index++;
            } else if (brightness <= 0) {
                brightness = 0;
                direction = 1;
            }

            await this.setAccentColor(color);
        }, 50 - speed / 4);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Glitch effect - random color flashes
     */
    private async glitchEffect(effectId: string, options: EffectOptions): Promise<void> {
        const intensity = options.intensity ?? 50;
        const speed = options.speed ?? 50;
        const duration = options.duration ?? 0;

        const interval = setInterval(async () => {
            const shouldGlitch = Math.random() * 100 < intensity;

            if (shouldGlitch) {
                const r = Math.floor(Math.random() * 255);
                const g = Math.floor(Math.random() * 255);
                const b = Math.floor(Math.random() * 255);
                const glitchColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

                await this.flashColor(glitchColor, 100);
            }
        }, 500 - speed * 4);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Particles effect - subtle color shifting
     */
    private async particles(effectId: string, options: EffectOptions): Promise<void> {
        const colors = options.colors ?? [
            '#4a148c', '#1a237e', '#006064', '#004d40', '#1b5e20'
        ];
        const speed = options.speed ?? 30;
        const duration = options.duration ?? 0;

        let hue = 0;

        const interval = setInterval(async () => {
            hue = (hue + 1) % 360;
            const saturation = 50 + Math.sin(hue * 0.1) * 20;
            const lightness = 10 + Math.sin(hue * 0.05) * 5;
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            await this.setEditorBackground(color, 20);
        }, 100 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Code rain effect - like matrix but with code-like colors
     */
    private async codeRain(effectId: string, options: EffectOptions): Promise<void> {
        const colors = options.colors ?? [
            '#0f0f0f', '#1a1a2e', '#16213e', '#0f3460', '#1a1a2e'
        ];
        const speed = options.speed ?? 50;
        const duration = options.duration ?? 0;

        let index = 0;

        const interval = setInterval(async () => {
            const color = colors[index % colors.length];
            await this.config.update(
                'colorCustomizations',
                {
                    'editor.background': color,
                    'terminal.background': color
                },
                vscode.ConfigurationTarget.Global
            );
            index++;
        }, 150 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Starfield effect - deep space colors
     */
    private async starfield(effectId: string, options: EffectOptions): Promise<void> {
        const baseColor = '#000510';
        const duration = options.duration ?? 0;
        const speed = options.speed ?? 30;

        let stars = 0;

        const interval = setInterval(async () => {
            stars = (stars + 1) % 100;
            const brightness = Math.floor(5 + Math.random() * 5);

            await this.config.update(
                'colorCustomizations',
                {
                    'editor.background': `#00${brightness.toString(16).padStart(2, '0')}${(brightness + 5).toString(16).padStart(2, '0')}`,
                    'editorLineNumber.foreground': '#4a5568'
                },
                vscode.ConfigurationTarget.Global
            );
        }, 200 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Plasma effect - smooth color gradients
     */
    private async plasma(effectId: string, options: EffectOptions): Promise<void> {
        const speed = options.speed ?? 50;
        const duration = options.duration ?? 0;

        let time = 0;

        const interval = setInterval(async () => {
            time += 0.05;

            const r = Math.floor(128 + 127 * Math.sin(time));
            const g = Math.floor(128 + 127 * Math.sin(time + 2));
            const b = Math.floor(128 + 127 * Math.sin(time + 4));

            const color = `rgb(${r * 0.3}, ${g * 0.3}, ${b * 0.3})`;

            await this.setEditorBackground(color, 30);
        }, 100 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Wave effect - wave-like color transitions
     */
    private async wave(effectId: string, options: EffectOptions): Promise<void> {
        const colors = options.colors ?? [
            '#1a0033', '#330066', '#4d0099', '#6600cc', '#7f00ff'
        ];
        const speed = options.speed ?? 40;
        const duration = options.duration ?? 0;

        let position = 0;

        const interval = setInterval(async () => {
            position += 0.1;
            const index = Math.floor(Math.sin(position) * colors.length / 2 + colors.length / 2);
            const color = colors[index % colors.length];

            await this.setEditorBackground(color, 30);
        }, 100 - speed);

        this.activeEffects.set(effectId, interval);

        if (duration > 0) {
            setTimeout(() => this.stopEffect(effectId), duration);
        }
    }

    /**
     * Helper: Set editor background with intensity
     */
    private async setEditorBackground(color: string, intensity: number = 50): Promise<void> {
        const alpha = (intensity / 100).toFixed(2);

        await this.config.update(
            'colorCustomizations',
            {
                'editor.background': color,
                'editor.lineHighlightBackground': color + '40'
            },
            vscode.ConfigurationTarget.Global
        );
    }

    /**
     * Helper: Set accent colors
     */
    private async setAccentColor(color: string): Promise<void> {
        await this.config.update(
            'colorCustomizations',
            {
                'statusBar.background': color,
                'activityBar.background': color + '80',
                'titleBar.activeBackground': color + '80'
            },
            vscode.ConfigurationTarget.Global
        );
    }

    /**
     * Helper: Flash a color briefly
     */
    private async flashColor(color: string, duration: number = 100): Promise<void> {
        const originalColors = this.config.get('colorCustomizations');

        await this.config.update(
            'colorCustomizations',
            {
                'editor.background': color
            },
            vscode.ConfigurationTarget.Global
        );

        setTimeout(async () => {
            await this.config.update(
                'colorCustomizations',
                originalColors,
                vscode.ConfigurationTarget.Global
            );
        }, duration);
    }

    /**
     * Get list of available effects
     */
    listEffects(): Array<{
        name: EffectType;
        description: string;
    }> {
        return [
            { name: 'matrix-rain', description: 'Classic Matrix-style green rain effect' },
            { name: 'neon-pulse', description: 'Pulsating neon colors' },
            { name: 'glitch', description: 'Random glitchy color flashes' },
            { name: 'particles', description: 'Subtle particle-like color shifting' },
            { name: 'code-rain', description: 'Code-themed rain effect' },
            { name: 'starfield', description: 'Deep space starfield effect' },
            { name: 'plasma', description: 'Smooth plasma-like gradients' },
            { name: 'wave', description: 'Wave-like color transitions' }
        ];
    }

    /**
     * Get active effects
     */
    getActiveEffects(): string[] {
        return Array.from(this.activeEffects.keys());
    }
}
