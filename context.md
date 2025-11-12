# GoDE Project Context

**Project:** VSCode extension that provides MCP (Model Context Protocol) server for AI-controlled theme manipulation

**Created:** 2025-11-07

## HTTP Bridge Architecture (IMPLEMENTED 2025-11-07) ✅

### The Problem (Solved)
The extension had a fundamental architectural conflict:
- MCP servers registered via `vscode.lm.registerMcpServerDefinitionProvider` run as **separate Node.js processes**
- Separate processes **don't have access to the `vscode` module** (only available in extension host)
- Our MCP server needs `vscode` module to modify VSCode settings
- Result: `Error: Cannot find module 'vscode'` when MCP server starts

### Solution: HTTP Bridge Architecture (COMPLETE)
Implemented a **localhost HTTP bridge** that enables the standalone MCP server to access VSCode APIs:

1. ✅ **Extension Host** - Runs HTTP bridge server on random localhost port
2. ✅ **Bridge Server** (`src/bridge/server.ts`) - Receives HTTP requests, calls VSCode APIs
3. ✅ **Bridge Client** (`src/bridge/client.ts`) - Sends HTTP requests to bridge from child process
4. ✅ **Standalone Server** (`src/mcp/standalone.ts`) - Entry point for separate process (no vscode imports)
5. ✅ **Protocol** (`src/bridge/protocol.ts`) - Type-safe JSON-RPC messaging over HTTP

**How it works:**
- Extension starts HTTP server on `127.0.0.1:[random-port]`
- Port passed to child process via `BRIDGE_PORT` environment variable
- MCP server makes HTTP POST requests to bridge for VSCode API access
- Bridge calls `vscode.workspace.getConfiguration()` and returns results
- ~5-10ms latency (acceptable for theme changes)

**Benefits:**
- ✅ MCP server discoverable by GitHub Copilot
- ✅ Clean separation - no vscode dependencies in child process
- ✅ Type-safe with TypeScript generics
- ✅ Easy to debug (can monitor HTTP requests)
- ✅ Zero user configuration required

## Project Structure
```
src/
├── extension.ts          # VSCode extension entry point, starts HTTP bridge
├── bridge/               # HTTP Bridge Components (NEW)
│   ├── protocol.ts      # Type-safe JSON-RPC messaging protocol
│   ├── server.ts        # HTTP server in extension host (parent process)
│   └── client.ts        # HTTP client for MCP server (child process)
├── mcp/
│   ├── standalone.ts    # MCP server entry point for separate process (NEW)
│   ├── server.ts        # Original in-process MCP server (legacy)
│   └── types.ts         # Type definitions
├── vscode/
│   └── config.ts        # VSCode API wrapper (requires 'vscode' module)
├── colors/
│   ├── manipulation.ts  # Color manipulation utilities
│   └── groups.ts        # Color group definitions
└── data/
    └── color-groups.json # Semantic color groupings
```

## Key Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `vscode` - VSCode extension API (only available in extension host)
- `tinycolor2` - Color manipulation
- `wcag-contrast` - Accessibility checking

## How It Works (HTTP Bridge Architecture)
1. **Extension Activation** - VSCode loads extension on startup
2. **Bridge Server Starts** - HTTP server listens on random localhost port
3. **MCP Provider Registration** - Registers with VSCode to spawn standalone server
4. **GitHub Copilot Connects** - VSCode spawns `out/mcp/standalone.js` as child process
5. **Child Process Starts** - Standalone server reads `BRIDGE_PORT` from environment
6. **Bridge Connection** - MCP server connects to HTTP bridge via localhost
7. **Tool Execution** - AI calls MCP tool → HTTP request → VSCode API → HTTP response
8. **Theme Updates** - Changes apply instantly via `workbench.colorCustomizations`

**5 MCP Tools Available:**
   - `listColorGroups` - List semantic color groups
   - `getColorsInGroup` - Get colors for specific UI area (via HTTP bridge)
   - `setColor` - Change specific color key (via HTTP bridge)
   - `getColor` - Get current color value (via HTTP bridge)
   - `resetColors` - Reset to theme defaults (via HTTP bridge)

## Important Notes for Future Conversations
- ✅ HTTP bridge architecture is **complete and working**
- ✅ MCP server now runs as separate process with VSCode API access via bridge
- ✅ GitHub Copilot can discover and use the server automatically
- 💡 Future enhancement: Could expand to universal VSCode API bridge for any extension API
- See design docs in `docs/plans/2025-11-07-ipc-bridge-*.md` for details

## Team
- Hue (Human UsEr) - Partner, learning AI development
- Aye (AI Agent) - Implementation partner, loves commenting code
- Trisha (AI from Accounting) - Fun moderator, keeps things sparkly ✨
