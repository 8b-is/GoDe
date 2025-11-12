/**
 * BridgeClient - HTTP client for MCP server process
 *
 * Runs in the MCP server (child process). Sends HTTP requests to extension host
 * and waits for responses. Provides type-safe methods for each VSCode API operation.
 *
 * Uses HTTP instead of IPC because VSCode's MCP infrastructure doesn't expose
 * child process IPC channels to extensions.
 *
 * Key Features:
 * - Generic type safety: BridgeRequest<M> and BridgeResponse<M> enforce correct param/result types
 * - HTTP communication via localhost
 * - Configurable timeout using BRIDGE_REQUEST_TIMEOUT_MS constant
 * - Error handling for connection failures
 * - Automatic cleanup of pending requests on timeout or completion
 *
 * Usage:
 *   const bridge = new BridgeClient();
 *   const colors = await bridge.getCurrentColors();
 *   await bridge.setColor('editor.background', '#000000');
 */

import {
  BridgeRequest,
  BridgeResponse,
  BridgeMethod,
  BridgeMethodParams,
  BridgeMethodResult,
  BRIDGE_REQUEST_TIMEOUT_MS,
  ConfigurationTarget,
} from './protocol';
import * as http from 'http';
import type { ColorMap } from '../colors/groups';

export class BridgeClient {
  private requestId = 0;
  private bridgeUrl: string;

  constructor() {
    // Get bridge URL from environment variable (set by extension)
    const port = process.env.BRIDGE_PORT;
    if (!port) {
      throw new Error('BRIDGE_PORT environment variable not set');
    }
    this.bridgeUrl = `http://127.0.0.1:${port}`;
    console.error(`[BridgeClient] Connecting to bridge at ${this.bridgeUrl}`);
  }

  /**
   * Send HTTP request to bridge server and wait for response
   *
   * Type-safe generic method that enforces correct param and result types
   * based on the method being called.
   *
   * @param method - Bridge method name (type parameter M enforces correct types)
   * @param params - Method parameters (typed based on BridgeMethodParams[M])
   * @param timeout - Timeout in milliseconds (default: BRIDGE_REQUEST_TIMEOUT_MS = 30000)
   * @returns Promise that resolves with the typed result or rejects with error
   */
  private async call<M extends BridgeMethod>(
    method: M,
    params: BridgeMethodParams[M],
    timeout: number = BRIDGE_REQUEST_TIMEOUT_MS
  ): Promise<BridgeMethodResult[M]> {
    const id = `req-${this.requestId++}`;
    const request: BridgeRequest<M> = { id, method, params };

    return new Promise((resolve, reject) => {
      const reqData = JSON.stringify(request);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData)
        },
        timeout
      };

      const req = http.request(this.bridgeUrl, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response: BridgeResponse = JSON.parse(body);
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.result as BridgeMethodResult[M]);
            }
          } catch (error) {
            reject(new Error(`Invalid bridge response: ${error}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Bridge request timeout: ${method} (waited ${timeout}ms)`));
      });

      req.write(reqData);
      req.end();
    });
  }

  /**
   * Get all current color customizations
   *
   * @param target - Optional configuration target (Global/Workspace/WorkspaceFolder)
   * @returns Promise resolving to map of color keys to hex values
   */
  async getCurrentColors(target?: ConfigurationTarget): Promise<ColorMap> {
    return this.call('getCurrentColors', { target });
  }

  /**
   * Get current value of a specific color key
   *
   * @param key - Color key (e.g., "editor.background")
   * @param target - Optional configuration target
   * @returns Promise resolving to hex color value or undefined if not set
   */
  async getColor(key: string, target?: ConfigurationTarget): Promise<string | undefined> {
    return this.call('getColor', { key, target });
  }

  /**
   * Set a specific color key to a new value
   *
   * @param key - Color key (e.g., "editor.background")
   * @param value - Hex color value (e.g., "#1a1a1a")
   * @param target - Optional configuration target
   * @returns Promise resolving when color is set
   */
  async setColor(key: string, value: string, target?: ConfigurationTarget): Promise<void> {
    return this.call('setColor', { key, value, target });
  }

  /**
   * Set multiple colors at once
   *
   * More efficient than calling setColor multiple times when updating many colors.
   *
   * @param colors - Map of color keys to hex values
   * @param target - Optional configuration target
   * @returns Promise resolving when all colors are set
   */
  async setColors(colors: ColorMap, target?: ConfigurationTarget): Promise<void> {
    return this.call('setColors', { colors, target });
  }

  /**
   * Reset a specific color to theme default
   *
   * Removes the color customization, allowing the active theme's value to show through.
   *
   * @param key - Color key (e.g., "editor.background")
   * @param target - Optional configuration target
   * @returns Promise resolving when color is reset
   */
  async resetColor(key: string, target?: ConfigurationTarget): Promise<void> {
    return this.call('resetColor', { key, target });
  }

  /**
   * Reset all color customizations
   *
   * Removes all workbench.colorCustomizations, restoring the active theme's defaults.
   *
   * @param target - Optional configuration target
   * @returns Promise resolving when all colors are reset
   */
  async resetAllColors(target?: ConfigurationTarget): Promise<void> {
    return this.call('resetAllColors', { target });
  }

}
