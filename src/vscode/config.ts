import * as vscode from 'vscode';
import { ColorMap } from '../colors/groups';

export class VSCodeConfig {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('workbench');
  }

  /**
   * Get current color customizations
   */
  async getCurrentColors(): Promise<ColorMap> {
    const colors = this.config.get<ColorMap>('colorCustomizations', {});
    return colors;
  }

  /**
   * Get a specific color value
   */
  async getColor(key: string): Promise<string | undefined> {
    const colors = await this.getCurrentColors();
    return colors[key];
  }

  /**
   * Set a single color
   */
  async setColor(
    key: string,
    value: string,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const colors = await this.getCurrentColors();
    colors[key] = value;
    await this.config.update('colorCustomizations', colors, target);
  }

  /**
   * Set multiple colors at once
   */
  async setColors(
    newColors: ColorMap,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const currentColors = await this.getCurrentColors();
    const mergedColors = { ...currentColors, ...newColors };
    await this.config.update('colorCustomizations', mergedColors, target);
  }

  /**
   * Remove a color customization (reset to theme default)
   */
  async resetColor(
    key: string,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    const colors = await this.getCurrentColors();
    delete colors[key];
    await this.config.update('colorCustomizations', colors, target);
  }

  /**
   * Reset all color customizations
   */
  async resetAllColors(
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    await this.config.update('colorCustomizations', {}, target);
  }

  /**
   * Get the current active theme
   */
  getActiveTheme(): vscode.ColorTheme {
    return vscode.window.activeColorTheme;
  }

  /**
   * Listen for configuration changes
   */
  onConfigurationChanged(
    callback: (event: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('workbench.colorCustomizations')) {
        callback(event);
      }
    });
  }
}
