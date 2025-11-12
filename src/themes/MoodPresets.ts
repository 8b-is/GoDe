import tinycolor from 'tinycolor2';

export interface MoodPreset {
    name: string;
    description: string;
    emoji: string;
    baseHue: number;
    saturation: number;
    brightness: number;
    colors: Record<string, string>;
}

export class MoodPresetsManager {
    private static presets: MoodPreset[] = [
        {
            name: 'Ocean Depths',
            description: 'Deep blues and teals for calm, focused coding',
            emoji: '🌊',
            baseHue: 200,
            saturation: 70,
            brightness: 30,
            colors: {}
        },
        {
            name: 'Sunset Vibes',
            description: 'Warm oranges and purples for creative evening sessions',
            emoji: '🌅',
            baseHue: 25,
            saturation: 80,
            brightness: 45,
            colors: {}
        },
        {
            name: 'Forest Zen',
            description: 'Natural greens for peaceful, meditative coding',
            emoji: '🌲',
            baseHue: 140,
            saturation: 50,
            brightness: 35,
            colors: {}
        },
        {
            name: 'Midnight Purple',
            description: 'Rich purples and magentas for late-night hacking',
            emoji: '🌙',
            baseHue: 280,
            saturation: 60,
            brightness: 25,
            colors: {}
        },
        {
            name: 'Cyberpunk',
            description: 'Neon pinks and cyans for futuristic coding',
            emoji: '🤖',
            baseHue: 320,
            saturation: 100,
            brightness: 50,
            colors: {}
        },
        {
            name: 'Autumn Leaves',
            description: 'Warm browns and oranges for cozy coding',
            emoji: '🍂',
            baseHue: 30,
            saturation: 60,
            brightness: 40,
            colors: {}
        },
        {
            name: 'Arctic Ice',
            description: 'Cool blues and whites for crisp, clean focus',
            emoji: '❄️',
            baseHue: 190,
            saturation: 40,
            brightness: 50,
            colors: {}
        },
        {
            name: 'Lava Flow',
            description: 'Hot reds and oranges for intense coding sessions',
            emoji: '🌋',
            baseHue: 10,
            saturation: 90,
            brightness: 35,
            colors: {}
        },
        {
            name: 'Sakura Dreams',
            description: 'Soft pinks and whites for gentle, beautiful code',
            emoji: '🌸',
            baseHue: 340,
            saturation: 50,
            brightness: 60,
            colors: {}
        },
        {
            name: 'Matrix Code',
            description: 'Classic green-on-black for that hacker aesthetic',
            emoji: '💚',
            baseHue: 120,
            saturation: 100,
            brightness: 20,
            colors: {}
        },
        {
            name: 'Deep Space',
            description: 'Dark purples and blues with starry accents',
            emoji: '🌌',
            baseHue: 260,
            saturation: 70,
            brightness: 15,
            colors: {}
        },
        {
            name: 'Golden Hour',
            description: 'Warm golds and soft yellows for inspired coding',
            emoji: '✨',
            baseHue: 45,
            saturation: 70,
            brightness: 55,
            colors: {}
        }
    ];

    public static getAllPresets(): MoodPreset[] {
        // Generate colors for each preset on demand
        return this.presets.map(preset => ({
            ...preset,
            colors: this.generatePresetColors(preset)
        }));
    }

    public static getPreset(name: string): MoodPreset | undefined {
        const preset = this.presets.find(p =>
            p.name.toLowerCase() === name.toLowerCase()
        );
        if (!preset) return undefined;

        return {
            ...preset,
            colors: this.generatePresetColors(preset)
        };
    }

    public static generatePresetColors(preset: MoodPreset): Record<string, string> {
        const base = tinycolor({
            h: preset.baseHue,
            s: preset.saturation,
            l: preset.brightness
        });

        // Generate harmonious color palette
        const complementary = base.clone().spin(180);
        const analogous1 = base.clone().spin(30);
        const analogous2 = base.clone().spin(-30);
        const triadic1 = base.clone().spin(120);
        const triadic2 = base.clone().spin(240);

        // Special handling for specific moods
        let colors: Record<string, string> = {};

        if (preset.name === 'Matrix Code') {
            // Classic Matrix green theme
            colors = {
                'editor.background': '#0d0d0d',
                'editor.foreground': '#00ff41',
                'editorCursor.foreground': '#00ff41',
                'editor.selectionBackground': '#00ff4133',
                'editor.lineHighlightBackground': '#00330f22',
                'sideBar.background': '#000000',
                'sideBar.foreground': '#00cc33',
                'activityBar.background': '#000000',
                'activityBar.foreground': '#00ff41',
                'statusBar.background': '#001a00',
                'statusBar.foreground': '#00ff41',
                'terminal.ansiGreen': '#00ff41',
                'terminal.ansiBrightGreen': '#33ff66',
                'list.activeSelectionBackground': '#00330f',
                'list.hoverBackground': '#00220a'
            };
        } else if (preset.name === 'Cyberpunk') {
            // Neon cyberpunk theme
            const neonPink = tinycolor('#ff00ff');
            const neonCyan = tinycolor('#00ffff');
            colors = {
                'editor.background': '#0a0015',
                'editor.foreground': '#e0e0ff',
                'editorCursor.foreground': neonPink.toHexString(),
                'editor.selectionBackground': neonPink.clone().setAlpha(0.3).toHexString(),
                'editor.lineHighlightBackground': '#1a0030',
                'sideBar.background': '#0d0020',
                'activityBar.background': '#000000',
                'activityBar.activeBorder': neonCyan.toHexString(),
                'statusBar.background': neonPink.darken(20).toHexString(),
                'statusBar.foreground': '#ffffff',
                'terminal.ansiMagenta': neonPink.toHexString(),
                'terminal.ansiCyan': neonCyan.toHexString(),
                'list.activeSelectionBackground': neonPink.clone().darken(30).toHexString()
            };
        } else {
            // Generate standard harmonic theme
            colors = {
                // Editor
                'editor.background': base.clone().darken(25).toHexString(),
                'editor.foreground': base.clone().lighten(45).desaturate(30).toHexString(),
                'editorCursor.foreground': analogous1.clone().lighten(20).toHexString(),
                'editor.selectionBackground': analogous1.clone().setAlpha(0.3).toHexString(),
                'editor.lineHighlightBackground': base.clone().darken(20).setAlpha(0.15).toHexString(),
                'editor.findMatchHighlightBackground': complementary.clone().lighten(10).setAlpha(0.4).toHexString(),
                'editorLineNumber.foreground': base.clone().darken(10).toHexString(),
                'editorLineNumber.activeForeground': analogous1.clone().lighten(10).toHexString(),

                // Sidebar
                'sideBar.background': base.clone().darken(30).toHexString(),
                'sideBar.foreground': base.clone().lighten(40).desaturate(20).toHexString(),
                'sideBarTitle.foreground': analogous1.clone().lighten(25).toHexString(),
                'sideBarSectionHeader.background': base.clone().darken(35).toHexString(),

                // Activity Bar
                'activityBar.background': base.clone().darken(35).toHexString(),
                'activityBar.foreground': base.clone().lighten(35).toHexString(),
                'activityBar.activeBorder': analogous1.clone().lighten(15).toHexString(),
                'activityBar.inactiveForeground': base.clone().lighten(10).toHexString(),

                // Status Bar
                'statusBar.background': base.clone().darken(30).toHexString(),
                'statusBar.foreground': base.clone().lighten(40).toHexString(),
                'statusBar.debuggingBackground': triadic1.clone().darken(10).toHexString(),
                'statusBar.noFolderBackground': base.clone().darken(25).toHexString(),

                // Terminal
                'terminal.background': base.clone().darken(28).toHexString(),
                'terminal.foreground': base.clone().lighten(40).desaturate(25).toHexString(),
                'terminal.ansiBlack': base.clone().darken(40).toHexString(),
                'terminal.ansiRed': triadic1.clone().lighten(10).toHexString(),
                'terminal.ansiGreen': triadic2.clone().lighten(10).toHexString(),
                'terminal.ansiYellow': analogous1.clone().lighten(20).toHexString(),
                'terminal.ansiBlue': base.clone().lighten(15).toHexString(),
                'terminal.ansiMagenta': complementary.clone().lighten(10).toHexString(),
                'terminal.ansiCyan': analogous2.clone().lighten(15).toHexString(),
                'terminal.ansiWhite': base.clone().lighten(45).desaturate(40).toHexString(),

                // Chat
                'chat.requestBackground': base.clone().darken(22).setAlpha(0.3).toHexString(),
                'chat.slashCommandBackground': analogous1.clone().setAlpha(0.2).toHexString(),
                'chat.slashCommandForeground': analogous1.clone().lighten(20).toHexString(),

                // Lists
                'list.activeSelectionBackground': base.clone().darken(18).toHexString(),
                'list.hoverBackground': base.clone().darken(23).setAlpha(0.5).toHexString(),
                'list.focusOutline': analogous1.clone().lighten(10).toHexString(),
                'list.activeSelectionForeground': base.clone().lighten(40).toHexString(),

                // Input
                'input.background': base.clone().darken(32).toHexString(),
                'input.foreground': base.clone().lighten(40).toHexString(),
                'input.border': base.clone().darken(20).toHexString(),
                'inputOption.activeBorder': analogous1.clone().toHexString(),

                // Buttons
                'button.background': analogous1.clone().darken(10).toHexString(),
                'button.foreground': '#ffffff',
                'button.hoverBackground': analogous1.clone().darken(5).toHexString(),

                // Notifications
                'notificationCenter.border': analogous1.clone().toHexString(),
                'notifications.background': base.clone().darken(28).toHexString(),
                'notifications.foreground': base.clone().lighten(40).toHexString(),

                // Git decorations
                'gitDecoration.modifiedResourceForeground': triadic1.clone().lighten(15).toHexString(),
                'gitDecoration.deletedResourceForeground': triadic2.clone().lighten(15).toHexString(),
                'gitDecoration.untrackedResourceForeground': analogous2.clone().lighten(15).toHexString(),
                'gitDecoration.addedResourceForeground': complementary.clone().lighten(15).toHexString(),
            };
        }

        return colors;
    }

    public static createCustomMood(
        name: string,
        baseColor: string,
        description?: string
    ): MoodPreset | undefined {
        const color = tinycolor(baseColor);
        if (!color.isValid()) {
            return undefined;
        }

        const hsl = color.toHsl();
        const preset: MoodPreset = {
            name,
            description: description || `Custom mood based on ${baseColor}`,
            emoji: '🎨',
            baseHue: hsl.h,
            saturation: hsl.s * 100,
            brightness: hsl.l * 100,
            colors: {}
        };

        preset.colors = this.generatePresetColors(preset);
        return preset;
    }
}
