# IPC Bridge Architecture Design

**Date:** 2025-11-07
**Status:** Approved
**Authors:** Hue & Aye

## Problem Statement

The gode extension needs to function as both:
1. A VSCode extension with access to `vscode` module APIs
2. An MCP server discoverable by GitHub Copilot (runs as separate Node process)

**The Conflict:** MCP servers registered via `McpStdioServerDefinition` run as separate processes that cannot import the `vscode` module, but we need that module to read/write VSCode theme settings.

## Solution: IPC Bridge Architecture

Separate the MCP protocol handling (runs in child process) from VSCode API access (runs in extension host) and connect them via Node.js IPC.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Copilot / AI Assistant                              │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Protocol (stdio)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server Process (separate Node process)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/mcp/standalone.ts                               │   │
│  │  - Entry point for separate process                  │   │
│  │  - Handles MCP protocol (tools, prompts, resources)  │   │
│  │  - Uses BridgeClient to call VSCode APIs             │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │ IPC Messages                       │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│  Extension Host Process (has vscode module)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  src/bridge/server.ts (BridgeServer)                 │   │
│  │  - Receives IPC messages from MCP server             │   │
│  │  - Calls VSCodeConfig methods                        │   │
│  │  - Sends responses back via IPC                      │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │  src/vscode/config.ts (VSCodeConfig)                 │   │
│  │  - Wraps vscode.workspace.getConfiguration()         │   │
│  │  - Reads/writes workbench.colorCustomizations        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. IPC Protocol (`src/bridge/protocol.ts`)

Simple JSON-RPC style messages over Node.js IPC:

```typescript
// Request (MCP server → Extension)
interface BridgeRequest {
  id: string;              // Unique request ID
  method: string;          // Method name to call
  params: any;             // Method parameters
}

// Response (Extension → MCP server)
interface BridgeResponse {
  id: string;              // Matches request ID
  result?: any;            // Success result
  error?: string;          // Error message if failed
}

// Supported methods (map 1:1 to VSCodeConfig)
type BridgeMethod =
  | 'getCurrentColors'
  | 'getColor'
  | 'setColor'
  | 'setColors'
  | 'resetColor'
  | 'resetAllColors';
```

### 2. Bridge Server (`src/bridge/server.ts`)

Runs in extension host, handles IPC messages:

```typescript
export class BridgeServer {
  private vscodeConfig: VSCodeConfig;

  constructor() {
    this.vscodeConfig = new VSCodeConfig();
    this.setupIPC();
  }

  private setupIPC() {
    // Listen for messages from child process
    process.on('message', async (request: BridgeRequest) => {
      const response = await this.handleRequest(request);
      process.send!(response);
    });
  }

  private async handleRequest(request: BridgeRequest): Promise<BridgeResponse> {
    try {
      const result = await this.callMethod(request.method, request.params);
      return { id: request.id, result };
    } catch (error) {
      return { id: request.id, error: String(error) };
    }
  }

  private async callMethod(method: string, params: any): Promise<any> {
    switch (method) {
      case 'getCurrentColors':
        return this.vscodeConfig.getCurrentColors();
      case 'getColor':
        return this.vscodeConfig.getColor(params.key);
      case 'setColor':
        return this.vscodeConfig.setColor(params.key, params.value);
      // ... other methods
    }
  }
}
```

### 3. Bridge Client (`src/bridge/client.ts`)

Runs in MCP server process, sends IPC messages:

```typescript
export class BridgeClient {
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.setupIPC();
  }

  private setupIPC() {
    // Listen for responses from parent process
    process.on('message', (response: BridgeResponse) => {
      const pending = this.pendingRequests.get(response.id);
      if (!pending) return;

      if (response.error) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response.result);
      }
      this.pendingRequests.delete(response.id);
    });
  }

  async call(method: string, params: any = {}): Promise<any> {
    const id = `req-${this.requestId++}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const request: BridgeRequest = { id, method, params };
      process.send!(request);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 5000);
    });
  }

  // Convenience methods
  async getCurrentColors() {
    return this.call('getCurrentColors');
  }

  async getColor(key: string) {
    return this.call('getColor', { key });
  }

  async setColor(key: string, value: string) {
    return this.call('setColor', { key, value });
  }

  // ... other methods
}
```

### 4. Standalone MCP Server (`src/mcp/standalone.ts`)

New entry point for separate process, uses BridgeClient:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BridgeClient } from '../bridge/client';
import { ColorManipulator } from '../colors/manipulation';
import colorGroupsData from '../../data/color-groups.json';

// Entry point - will be spawned by VSCode as separate process
async function main() {
  const bridge = new BridgeClient();
  const colorManipulator = new ColorManipulator();

  const server = new Server({
    name: 'gode',
    version: '0.0.1',
  }, {
    capabilities: { tools: {} },
  });

  // Set up MCP tool handlers using bridge client
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'setColor':
        if (!colorManipulator.isValidColor(args.value)) {
          throw new Error(`Invalid color: ${args.value}`);
        }
        const oldValue = await bridge.getColor(args.key);
        await bridge.setColor(args.key, args.value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, key: args.key, oldValue, newValue: args.value }, null, 2)
          }]
        };

      case 'getColor':
        const value = await bridge.getColor(args.key);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ key: args.key, value }, null, 2)
          }]
        };

      // ... other tools
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GoDE standalone server started');
}

main().catch(console.error);
```

### 5. Extension Entry Point Updates (`src/extension.ts`)

```typescript
export async function activate(context: vscode.ExtensionContext) {
  console.log('GoDE extension is now active');

  // Start the bridge server in extension host
  const bridgeServer = new BridgeServer();

  // Register MCP server provider (now points to standalone.ts)
  const mcpProvider = vscode.lm.registerMcpServerDefinitionProvider(
    'gode-provider',
    {
      async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        const extensionPath = context.extensionPath;
        // CHANGE: Point to standalone.ts instead of server.ts
        const serverPath = path.join(extensionPath, 'out', 'mcp', 'standalone.js');

        return [
          new vscode.McpStdioServerDefinition(
            'gode',
            'node',
            [serverPath],
            {
              cwd: extensionPath,
              // The child process will have access to IPC automatically
              // when spawned this way by VSCode
            }
          ),
        ];
      },

      async resolveMcpServerDefinition(
        definition: vscode.McpServerDefinition
      ): Promise<vscode.McpServerDefinition> {
        console.log('GoDE server definition resolved');
        return definition;
      },
    }
  );

  context.subscriptions.push(mcpProvider);

  // Keep the status command
  const statusCommand = vscode.commands.registerCommand(
    'gode.showStatus',
    () => {
      vscode.window.showInformationMessage(
        '🎨 GoDE is running! Your AI assistant can now control your VSCode colors!'
      );
    }
  );

  context.subscriptions.push(statusCommand);
}
```

## Process Lifecycle

1. **Extension Activates:**
   - Extension loads in VSCode extension host
   - BridgeServer initializes and sets up IPC listener
   - MCP provider registers with VSCode

2. **GitHub Copilot Requests MCP Server:**
   - VSCode spawns `out/mcp/standalone.js` as child process
   - Child process has IPC channel to parent (extension host) automatically
   - Standalone server creates BridgeClient and sets up IPC

3. **AI Makes MCP Tool Call:**
   - GitHub Copilot sends MCP request to standalone server via stdio
   - Standalone server calls BridgeClient method (e.g., `setColor()`)
   - BridgeClient sends IPC message to extension host
   - BridgeServer receives message, calls VSCodeConfig
   - VSCodeConfig updates `workbench.colorCustomizations`
   - BridgeServer sends IPC response back
   - BridgeClient resolves promise
   - Standalone server returns MCP response to Copilot

4. **Extension Deactivates:**
   - VSCode kills child process automatically
   - BridgeServer cleans up IPC listeners

## Error Handling

- **IPC timeout:** 5 second timeout on all bridge calls
- **Invalid messages:** Validate request/response structure
- **Bridge unavailable:** Graceful error messages to MCP client
- **VSCode API errors:** Caught and returned as error responses

## Benefits

✅ **Zero user configuration** - Install extension and it just works
✅ **Clean separation** - MCP server has no vscode dependencies
✅ **Fast IPC** - ~1-2ms latency vs ~5-10ms for HTTP
✅ **Automatic lifecycle** - VSCode manages child process
✅ **Type-safe** - Protocol defined in TypeScript
✅ **Debuggable** - Can add logging to IPC messages

## Trade-offs

❌ **More complex** - Two processes with message passing
❌ **Harder to debug** - Need to trace across process boundary
✅ **But worth it** - Best user experience wins

## Migration Path

1. Create bridge protocol types
2. Implement BridgeServer in extension host
3. Implement BridgeClient for child process
4. Create standalone.ts entry point
5. Update extension.ts to use standalone.ts
6. Test with GitHub Copilot
7. Remove old server.ts in-process code

## Testing Strategy

- **Unit tests:** Test BridgeClient/BridgeServer with mock IPC
- **Integration tests:** Launch actual child process and verify IPC
- **E2E tests:** Test with real GitHub Copilot in VSCode
- **Error cases:** Test timeout, invalid messages, crashed child process

## Future Enhancements

- Add metrics/telemetry for IPC performance
- Support batch operations (multiple colors in one IPC call)
- Add IPC message compression for large responses
- Consider WebSocket upgrade for very chatty scenarios

---

**Next Steps:** Create implementation plan with detailed tasks
