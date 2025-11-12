import * as vscode from 'vscode';
import { AudioAnalysisData } from './AudioPlayerProvider';
import tinycolor from 'tinycolor2';

export class ReactiveThemeController {
    private baseColors: Map<string, string> = new Map();
    private isActive = false;
    private smoothingFactor = 0.3;
    private lastHue = 0;
    private lastSaturation = 50;
    private lastBrightness = 50;

    constructor() {
        // Store original colors when activated
    }

    public activate() {
        if (this.isActive) return;

        this.isActive = true;
        this.captureBaseColors();
        vscode.window.showInformationMessage('🎵 Audio-reactive theme activated! Your colors will dance to the music!');
    }

    public deactivate() {
        if (!this.isActive) return;

        this.isActive = false;
        this.restoreBaseColors();
        vscode.window.showInformationMessage('Audio-reactive theme deactivated.');
    }

    private captureBaseColors() {
        const config = vscode.workspace.getConfiguration();
        const customizations = config.get<Record<string, string>>('workbench.colorCustomizations') || {};

        // Capture current colors
        this.baseColors.clear();
        Object.entries(customizations).forEach(([key, value]) => {
            this.baseColors.set(key, value);
        });
    }

    private restoreBaseColors() {
        const config = vscode.workspace.getConfiguration();
        const restored: Record<string, string> = {};

        this.baseColors.forEach((value, key) => {
            restored[key] = value;
        });

        config.update('workbench.colorCustomizations', restored, vscode.ConfigurationTarget.Global);
    }

    public processAudioData(data: AudioAnalysisData) {
        if (!this.isActive) return;

        // Map audio features to color parameters with smoothing
        const targetHue = Math.floor(data.dominantFreq * 360); // Frequency to hue
        const targetSaturation = 40 + data.energy * 60; // Energy to saturation
        const targetBrightness = 30 + data.spectralCentroid * 40; // Brightness from spectral content

        // Smooth transitions
        this.lastHue = this.smooth(this.lastHue, targetHue, this.smoothingFactor);
        this.lastSaturation = this.smooth(this.lastSaturation, targetSaturation, this.smoothingFactor);
        this.lastBrightness = this.smooth(this.lastBrightness, targetBrightness, this.smoothingFactor);

        // Generate color palette based on audio
        const baseColor = tinycolor({ h: this.lastHue, s: this.lastSaturation, l: this.lastBrightness });

        // Beat reaction - flash brighter on beats
        const beatBoost = data.isBeat ? 15 : 0;

        // Create themed colors
        const editorBg = baseColor.clone().darken(25 - beatBoost).toHexString();
        const sidebarBg = baseColor.clone().darken(30).spin(30).toHexString();
        const accentColor = baseColor.clone().lighten(20 + beatBoost).saturate(20).toHexString();
        const selectionBg = baseColor.clone().setAlpha(0.3).toHexString();

        // Complementary color for contrast
        const complementary = baseColor.clone().spin(180);
        const highlightColor = complementary.clone().lighten(30 + beatBoost).toHexString();

        // Analogous colors for harmony
        const analogous1 = baseColor.clone().spin(30).lighten(10);
        const analogous2 = baseColor.clone().spin(-30).lighten(10);

        // Apply to theme
        const colorCustomizations: Record<string, string> = {
            // Editor
            'editor.background': editorBg,
            'editor.selectionBackground': selectionBg,
            'editor.lineHighlightBackground': baseColor.clone().darken(20).setAlpha(0.1).toHexString(),
            'editorCursor.foreground': accentColor,
            'editor.findMatchHighlightBackground': highlightColor,

            // Sidebar
            'sideBar.background': sidebarBg,
            'sideBarSectionHeader.background': baseColor.clone().darken(35).toHexString(),

            // Activity bar
            'activityBar.background': baseColor.clone().darken(35).toHexString(),
            'activityBar.activeBorder': accentColor,
            'activityBar.foreground': accentColor,

            // Status bar - reacts strongly to beats
            'statusBar.background': data.isBeat
                ? accentColor
                : baseColor.clone().darken(30).toHexString(),
            'statusBar.foreground': data.isBeat
                ? '#000000'
                : baseColor.clone().lighten(40).toHexString(),

            // Terminal - use analogous colors
            'terminal.ansiBlue': analogous1.toHexString(),
            'terminal.ansiMagenta': analogous2.toHexString(),
            'terminal.ansiCyan': baseColor.clone().lighten(20).toHexString(),

            // Chat interface
            'chat.requestBackground': baseColor.clone().darken(20).setAlpha(0.2).toHexString(),
            'chat.slashCommandBackground': accentColor + '33',

            // Notifications
            'notificationCenter.border': accentColor,
            'notifications.background': sidebarBg,

            // Lists and trees
            'list.activeSelectionBackground': baseColor.clone().darken(15).toHexString(),
            'list.hoverBackground': baseColor.clone().darken(22).setAlpha(0.5).toHexString(),
            'list.focusOutline': accentColor,
        };

        // Apply the colors
        const config = vscode.workspace.getConfiguration();
        config.update('workbench.colorCustomizations', colorCustomizations, vscode.ConfigurationTarget.Global);
    }

    private smooth(current: number, target: number, factor: number): number {
        return current + (target - current) * factor;
    }
}
