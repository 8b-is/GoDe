/**
 * IPC Protocol for VSCode API Bridge
 *
 * Simple JSON-RPC style messaging between MCP server (child) and extension (parent).
 * MCP server sends requests to extension via process.send(), extension responds same way.
 */

import type { ColorMap } from '../colors/groups';

/**
 * Configuration target for VS Code settings
 */
export type ConfigurationTarget = 'Global' | 'Workspace' | 'WorkspaceFolder';

/**
 * Bridge request timeout in milliseconds (30 seconds)
 */
export const BRIDGE_REQUEST_TIMEOUT_MS = 30000;

/**
 * Request from MCP server → Extension host
 * Generic type parameter enforces type-safe params based on method
 */
export interface BridgeRequest<M extends BridgeMethod = BridgeMethod> {
  id: string;                          // Unique request ID (e.g., "req-1", "req-2")
  method: M;                           // Method name to invoke
  params: BridgeMethodParams[M];       // Type-safe method parameters
}

/**
 * Response from Extension host → MCP server
 * Generic type parameter enforces type-safe results based on method
 */
export interface BridgeResponse<M extends BridgeMethod = BridgeMethod> {
  id: string;                          // Matches request.id
  result?: BridgeMethodResult[M];      // Type-safe success result (if no error)
  error?: string;                      // Error message (if failed)
}

/**
 * Available bridge methods (map 1:1 to VSCodeConfig methods)
 */
export type BridgeMethod =
  | 'getCurrentColors'    // Get all color customizations
  | 'getColor'           // Get specific color value (params: { key: string })
  | 'setColor'           // Set specific color (params: { key: string, value: string })
  | 'setColors'          // Set multiple colors (params: { colors: Record<string, string> })
  | 'resetColor'         // Reset specific color (params: { key: string })
  | 'resetAllColors';    // Reset all customizations

/**
 * Type-safe parameter types for each method
 * Now includes optional target parameter for configuration scope
 */
export interface BridgeMethodParams {
  getCurrentColors: { target?: ConfigurationTarget };
  getColor: { key: string; target?: ConfigurationTarget };
  setColor: { key: string; value: string; target?: ConfigurationTarget };
  setColors: { colors: Record<string, string>; target?: ConfigurationTarget };
  resetColor: { key: string; target?: ConfigurationTarget };
  resetAllColors: { target?: ConfigurationTarget };
}

/**
 * Type-safe result types for each method
 * Maps method names to their expected return values
 */
export interface BridgeMethodResult {
  getCurrentColors: ColorMap;           // Returns all color customizations
  getColor: string | undefined;         // Returns color value or undefined
  setColor: void;                       // No return value
  setColors: void;                      // No return value
  resetColor: void;                     // No return value
  resetAllColors: void;                 // No return value
}

/**
 * Type guard to check if an object is a valid BridgeRequest
 * @param obj - Object to check
 * @returns True if object is a BridgeRequest
 */
export function isBridgeRequest(obj: unknown): obj is BridgeRequest {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const req = obj as Partial<BridgeRequest>;

  return (
    typeof req.id === 'string' &&
    typeof req.method === 'string' &&
    (req.method === 'getCurrentColors' ||
     req.method === 'getColor' ||
     req.method === 'setColor' ||
     req.method === 'setColors' ||
     req.method === 'resetColor' ||
     req.method === 'resetAllColors') &&
    'params' in req
  );
}

/**
 * Type guard to check if an object is a valid BridgeResponse
 * @param obj - Object to check
 * @returns True if object is a BridgeResponse
 */
export function isBridgeResponse(obj: unknown): obj is BridgeResponse {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const res = obj as Partial<BridgeResponse>;

  return (
    typeof res.id === 'string' &&
    ('result' in res || 'error' in res)
  );
}
