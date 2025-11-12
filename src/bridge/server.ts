import * as vscode from 'vscode';
import * as http from 'http';
import { BridgeRequest, BridgeResponse, BridgeMethod, isBridgeRequest, ConfigurationTarget } from './protocol';
import { VSCodeConfig } from '../vscode/config';

/**
 * BridgeServer - HTTP server for extension host process
 *
 * Runs in the VSCode extension host (parent process). Receives HTTP requests from
 * MCP server (child process), calls VSCode APIs via VSCodeConfig, and sends
 * responses back.
 *
 * This is the bridge that allows the standalone MCP server to access VSCode APIs
 * despite running in a separate process that doesn't have the 'vscode' module.
 *
 * Uses HTTP instead of IPC because VSCode's MCP infrastructure doesn't expose
 * child process IPC channels to extensions.
 *
 * Usage:
 *   const bridge = new BridgeServer();
 *   const port = await bridge.start();
 *   // Pass port to child via BRIDGE_PORT env var
 */
export class BridgeServer {
  private vscodeConfig: VSCodeConfig;
  private server: http.Server | undefined;
  private port: number = 0;

  constructor() {
    this.vscodeConfig = new VSCodeConfig();
  }

  /**
   * Start HTTP server on localhost for bridge communication
   * @returns Port number the server is listening on
   */
  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // Only accept POST requests
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Read request body
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const request: BridgeRequest = JSON.parse(body);
            const response = await this.handleRequest(request);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('[BridgeServer] Error processing request:', errorMsg);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errorMsg }));
          }
        });
      });

      // Listen on random available port on localhost only
      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address();
        if (addr && typeof addr !== 'string') {
          this.port = addr.port;
          console.log(`[BridgeServer] HTTP bridge listening on http://127.0.0.1:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('Failed to start bridge server'));
        }
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[BridgeServer] HTTP bridge stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Convert protocol ConfigurationTarget string to VSCode ConfigurationTarget enum
   *
   * This maps the simple string types from our IPC protocol to VSCode's
   * actual ConfigurationTarget enum values.
   *
   * @param target - Configuration target string from protocol
   * @returns VSCode ConfigurationTarget enum value
   */
  private mapConfigurationTarget(target?: ConfigurationTarget): vscode.ConfigurationTarget {
    if (!target) {
      return vscode.ConfigurationTarget.Global;
    }

    switch (target) {
      case 'Global':
        return vscode.ConfigurationTarget.Global;
      case 'Workspace':
        return vscode.ConfigurationTarget.Workspace;
      case 'WorkspaceFolder':
        return vscode.ConfigurationTarget.WorkspaceFolder;
      default:
        console.warn(`[BridgeServer] Unknown target "${target}", defaulting to Global`);
        return vscode.ConfigurationTarget.Global;
    }
  }

  /**
   * Handle incoming IPC request from child process
   *
   * This method will be called by the extension when it receives a message
   * from the child process.
   *
   * @param request - Bridge request from child process
   * @returns Promise resolving to bridge response
   */
  async handleRequest(request: BridgeRequest): Promise<BridgeResponse> {
    try {
      // Call the method and get the result
      const result = await this.callMethod(request.method, request.params);

      // Return successful response with proper type
      return {
        id: request.id,
        result
      };
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[BridgeServer] Error handling ${request.method}:`, errorMessage);

      return {
        id: request.id,
        error: errorMessage
      };
    }
  }

  /**
   * Route method call to appropriate VSCodeConfig method
   *
   * This is where we validate parameters and call the right VSCode API method.
   * Each case handles parameter validation before calling VSCodeConfig.
   * The optional 'target' parameter is mapped to VSCode's ConfigurationTarget enum.
   *
   * @param method - Bridge method name
   * @param params - Method parameters (already typed by BridgeRequest)
   * @returns Promise resolving to method result
   */
  private async callMethod(method: BridgeMethod, params: any): Promise<any> {
    switch (method) {
      case 'getCurrentColors':
        // No parameters needed - just get all colors
        // (target parameter ignored for getCurrentColors as it only reads)
        return await this.vscodeConfig.getCurrentColors();

      case 'getColor':
        // Validate required parameter: key
        if (!params?.key) {
          throw new Error('Missing required parameter: key');
        }
        // (target parameter ignored for getColor as it only reads)
        return await this.vscodeConfig.getColor(params.key);

      case 'setColor':
        // Validate required parameters: key and value
        if (!params?.key || !params?.value) {
          throw new Error('Missing required parameters: key, value');
        }
        // Map target string to VSCode ConfigurationTarget enum
        const setColorTarget = this.mapConfigurationTarget(params.target);
        await this.vscodeConfig.setColor(params.key, params.value, setColorTarget);
        return { success: true };

      case 'setColors':
        // Validate required parameter: colors object
        if (!params?.colors) {
          throw new Error('Missing required parameter: colors');
        }
        // Map target string to VSCode ConfigurationTarget enum
        const setColorsTarget = this.mapConfigurationTarget(params.target);
        await this.vscodeConfig.setColors(params.colors, setColorsTarget);
        return { success: true };

      case 'resetColor':
        // Validate required parameter: key
        if (!params?.key) {
          throw new Error('Missing required parameter: key');
        }
        // Map target string to VSCode ConfigurationTarget enum
        const resetColorTarget = this.mapConfigurationTarget(params.target);
        await this.vscodeConfig.resetColor(params.key, resetColorTarget);
        return { success: true };

      case 'resetAllColors':
        // No parameters needed - reset everything
        // Map target string to VSCode ConfigurationTarget enum
        const resetAllTarget = this.mapConfigurationTarget(params?.target);
        await this.vscodeConfig.resetAllColors(resetAllTarget);
        return { success: true };

      default:
        // This should never happen thanks to TypeScript types, but just in case
        throw new Error(`Unknown bridge method: ${method}`);
    }
  }

}
