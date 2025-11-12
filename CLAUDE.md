# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GoDE** (Go Development Environment) is a VSCode extension that provides AI-controlled dynamic theme manipulation via Model Context Protocol (MCP), with audio-reactive themes and mel spectrogram visualization.

### Key Features
- 12 MCP tools for AI-driven theme control (listColorGroups, getColorsInGroup, setColor, getColor, resetColors, listMoodPresets, applyMoodPreset, createCustomMood, generateColorHarmony, generateGradient, adjustColorTemperature, ensureReadableColor)
- 12 pre-built mood presets (Ocean Depths, Sunset Vibes, Cyberpunk, Matrix Code, etc.)
- Audio player with real-time mel spectrogram visualization (128 mel bins, 20ms updates)
- Audio-reactive theming (theme colors dance to music based on frequency, energy, brightness, and beats)
- Advanced color operations (harmonies, gradients, temperature adjustments, WCAG accessibility)

## Development Commands

### Build & Compile
```bash
npm install              # Install dependencies
npm run compile          # Compile TypeScript to out/ directory
npm run watch            # Watch mode for development
npm run lint             # Run ESLint on src/**/*.ts
```

### Testing & Running
- Press **F5** in VSCode to launch Extension Development Host
- Use command palette: "GoDE: Show Status" to verify installation
- Open Explorer sidebar → "Audio Player & Visualizer" panel to test audio features

## Architecture

### Three-Layer System

**1. Extension Host (src/extension.ts)**
- Runs in VSCode's main process
- Initializes BridgeServer (HTTP server on random port)
- Registers MCP server provider (auto-discovery by AI assistants)
- Manages Audio Player webview and ReactiveThemeController

**2. Bridge Layer (src/bridge/)**
- **protocol.ts**: Type-safe IPC protocol definitions (BridgeRequest, BridgeResponse, BridgeMethod types)
- **server.ts**: HTTP server in extension host (receives requests from standalone MCP server)
- **client.ts**: HTTP client used by standalone server (sends requests to extension host)
- Communication: Child process (MCP server) → HTTP POST → Parent process (Extension host) → VSCode API

**3. MCP Server (src/mcp/)**
- **standalone.ts**: Entry point for child process, spawned by VSCode with stdio transport
- **server.ts**: ThemeMCPServer class implementing 12 MCP tools
- Reads BRIDGE_PORT from environment variable to connect to extension host
- Uses @modelcontextprotocol/sdk for MCP protocol

### Why HTTP Bridge?
VSCode extensions run in Node.js but MCP servers use stdio transport. The extension spawns a child process (standalone.js) that communicates via stdin/stdout with AI assistants, while using HTTP to call back into the extension host for VSCode API access.

### Key Components

**Color Management (src/colors/)**
- **groups.ts**: Type definitions for semantic color groups (editor, sidebar, chat, terminal, notifications, statusBar, git)
- **manipulation.ts**: ColorManipulator class for basic color operations
- **advanced.ts**: Advanced color operations (harmonies, gradients, temperature, accessibility)
- **data/color-groups.json**: Static mapping of VSCode color keys to semantic groups

**Audio System (src/audio/)**
- **AudioPlayerProvider.ts**: Webview provider for audio player UI (mel spectrogram, controls, analysis)
- **ReactiveThemeController.ts**: Handles audio-reactive theme updates (frequency→hue, energy→saturation, brightness→luminance)
- Uses Web Audio API with FFT (2048 samples) and mel filterbank (128 bins)

**Themes (src/themes/)**
- **MoodPresets.ts**: 12 pre-built mood configurations with full ColorMap definitions

**VSCode Integration (src/vscode/)**
- **config.ts**: VSCodeConfig class wraps workbench.colorCustomizations API

## Important Technical Details

### Type Safety
- All bridge communication is type-safe via TypeScript generics
- BridgeMethod type maps method names to parameter/result types
- isBridgeRequest/isBridgeResponse type guards validate messages

### Configuration Scope
- Color changes default to Global scope (affects all workspaces)
- Can optionally target Workspace or WorkspaceFolder scope
- Changes persist in VSCode settings.json

### Color Format
- All colors use hex format: "#RRGGBB" or "#RRGGBBAA"
- tinycolor2 library handles color manipulation
- wcag-contrast library validates accessibility (WCAG AA/AAA standards)

### Audio Analysis
- FFT size: 2048 samples
- Mel bins: 128 (perceptually uniform frequency resolution)
- Update rate: 20ms per spectrogram line
- Features extracted: energy, spectral centroid, beat detection, BPM estimation
- Audio-reactive mapping: bass→cool colors, treble→warm colors, energy→saturation, brightness→luminance

## Code Conventions

### File Organization
- TypeScript compiled from src/ to out/
- Source structure mirrors logical layers (extension → bridge → mcp, colors, audio, themes, vscode)
- Type definitions in dedicated files (protocol.ts, groups.ts, types.ts)

### Naming Patterns
- Classes: PascalCase (BridgeServer, ColorManipulator, ThemeMCPServer)
- MCP tools: camelCase (listColorGroups, applyMoodPreset)
- Color keys: kebab-case matching VSCode conventions (editor.background, sidebar.foreground)

### Error Handling
- Bridge timeout: 30 seconds (BRIDGE_REQUEST_TIMEOUT_MS)
- All bridge methods return typed results or throw errors
- MCP server catches errors and returns formatted error responses

## Dependencies

### Production
- `@modelcontextprotocol/sdk@^1.0.0` - MCP protocol implementation
- `tinycolor2@^1.6.0` - Color manipulation and math
- `wcag-contrast@^3.0.0` - Accessibility validation

### Development
- `typescript@^5.5.0` - TypeScript compiler
- `@types/vscode@^1.105.0` - VSCode API types
- `@types/tinycolor2@^1.4.6` - tinycolor2 types
- `eslint@^8.x` with TypeScript plugins

## Testing Strategy

### Manual Testing Workflow
1. Press F5 to launch Extension Development Host
2. Open command palette: "GoDE: Show Status" to verify MCP tools loaded
3. Test MCP tools via AI assistant (GitHub Copilot, Claude, etc.):
   - "List available color groups"
   - "Apply Cyberpunk mood preset"
   - "Generate complementary harmony from #3498db"
4. Test audio features:
   - Open Explorer sidebar → "Audio Player & Visualizer"
   - Load audio file
   - Verify spectrogram renders
   - Enable audio-reactive theme and verify colors change with music

### Areas to Test After Changes
- **Bridge communication**: Verify extension host can receive/respond to HTTP requests from standalone server
- **MCP tools**: Test each tool returns expected results via AI assistant
- **Color operations**: Verify hex color parsing, WCAG contrast validation, harmony generation
- **Audio analysis**: Check spectrogram rendering, beat detection, BPM estimation
- **Audio-reactive theming**: Verify smooth color transitions with music

## Common Development Tasks

### Adding a New MCP Tool
1. Add tool definition to `src/mcp/server.ts` in `setupHandlers()` ListToolsRequestSchema handler
2. Add tool implementation in CallToolRequestSchema handler
3. If tool needs VSCode API access, add new method to `src/bridge/protocol.ts` (BridgeMethod, BridgeMethodParams, BridgeMethodResult)
4. Implement bridge method in `src/bridge/server.ts` and `src/vscode/config.ts`
5. Update README.md with tool documentation

### Adding a New Mood Preset
1. Define ColorMap in `src/themes/MoodPresets.ts`
2. Add to MOOD_PRESETS array with name, description, emoji
3. Preset automatically available via listMoodPresets and applyMoodPreset tools

### Modifying Color Groups
1. Edit `data/color-groups.json` to add/remove color keys
2. Update ColorGroupName type in `src/colors/groups.ts` if adding new group
3. No code changes needed - groups are loaded dynamically

## VSCode Extension Specifics

### Activation
- **Trigger**: onStartupFinished (extension loads automatically on VSCode launch)
- **Sequence**: Extension activates → BridgeServer starts → MCP provider registers → AI assistants discover server

### MCP Server Discovery
- Extension implements `vscode.lm.registerMcpServerDefinitionProvider`
- Returns `vscode.McpStdioServerDefinition` pointing to `out/mcp/standalone.js`
- Passes BRIDGE_PORT to child process via environment variable
- AI assistants (GitHub Copilot, Claude) automatically discover and connect

### Webview Communication
- Audio player uses standard VSCode webview API
- Webview posts messages to extension host with audio analysis data
- ReactiveThemeController processes audio features and updates theme colors

## Troubleshooting

### Bridge Connection Issues
- Verify BRIDGE_PORT environment variable is set in standalone process
- Check bridgeServer.start() returns valid port number
- Ensure no firewall blocking localhost HTTP connections

### MCP Tools Not Appearing
- Verify extension activates: check "GoDE extension is now active" in Debug Console
- Confirm MCP server provider registered: check "GoDE server definition resolved" message
- Test with command: "GoDE: Show Status"

### Audio Player Not Loading
- Check webview registration in extension.ts
- Verify AudioPlayerProvider.viewType matches package.json contribution
- Ensure webview HTML loads correctly (check Console in webview DevTools)

### Colors Not Applying
- Verify VSCodeConfig can read/write workbench.colorCustomizations
- Check color format is valid hex: /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/
- Confirm target scope (Global/Workspace/WorkspaceFolder) has write permissions
