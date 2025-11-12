import * as vscode from 'vscode';
import * as path from 'path';
import { BridgeServer } from './bridge/server';
import { AudioPlayerProvider } from './audio/AudioPlayerProvider';
import { ReactiveThemeController } from './audio/ReactiveThemeController';

let bridgeServer: BridgeServer | undefined;
let reactiveController: ReactiveThemeController | undefined;

/**
 * Extension activation - called when VSCode loads the extension
 * This happens on startup (onStartupFinished activation event)
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('GoDE extension is now active');

  // Initialize HTTP bridge server in extension host
  // This runs in the parent process and handles HTTP requests from MCP server (child)
  bridgeServer = new BridgeServer();
  console.log('GoDE bridge server initialized');

  // Initialize audio-reactive theme controller
  reactiveController = new ReactiveThemeController();

  // Register audio player webview
  const audioPlayerProvider = new AudioPlayerProvider(
    context.extensionUri,
    (audioData) => {
      // Handle audio analysis data for reactive theming
      if (reactiveController) {
        reactiveController.processAudioData(audioData);
      }
    }
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AudioPlayerProvider.viewType,
      audioPlayerProvider
    )
  );

  // Register MCP server provider for automatic discovery by GitHub Copilot and other AI tools
  // This makes the MCP server automatically available without manual configuration!
  const mcpProvider = vscode.lm.registerMcpServerDefinitionProvider(
    'gode-provider', // Must match the ID in package.json
    {
      // Provide the MCP server definitions
      async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        // Start bridge server and get port
        const bridgePort = await bridgeServer!.start();

        // Get the path to our compiled extension
        const extensionPath = context.extensionPath;
        // IMPORTANT: Point to standalone.js (runs as separate process with HTTP bridge)
        const serverPath = path.join(extensionPath, 'out', 'mcp', 'standalone.js');

        // Return a single stdio-based MCP server definition
        return [
          new vscode.McpStdioServerDefinition(
            'gode', // Unique server ID (label)
            'node', // Command to execute
            [serverPath], // Arguments (path to our standalone server)
            {
              // Pass bridge port to child process
              BRIDGE_PORT: String(bridgePort)
            }
          ),
        ];
      },

      // Resolve the server definition when it's about to start
      // This is where we could add authentication or user prompts if needed
      async resolveMcpServerDefinition(
        definition: vscode.McpServerDefinition
      ): Promise<vscode.McpServerDefinition> {
        console.log('GoDE server definition resolved for AI assistant');
        return definition;
      },
    }
  );

  // Add to subscriptions so it gets cleaned up on deactivation
  context.subscriptions.push(mcpProvider);

  // Register a command to test the extension is loaded
  const statusCommand = vscode.commands.registerCommand(
    'gode.showStatus',
    () => {
      vscode.window.showInformationMessage(
        '🎨🎵 GoDE is running!\n\n' +
        '✅ MCP Tools: 12 color & mood tools available\n' +
        '✅ Mood Presets: 12 beautiful themes\n' +
        '✅ Audio Player: Mel spectrogram visualizer\n' +
        '✅ Audio-Reactive: Theme dances to music!\n\n' +
        'Try: "Apply the Cyberpunk mood preset" or "Show me Ocean Depths theme"'
      );
    }
  );

  context.subscriptions.push(statusCommand);

  // Show a welcome notification on first install (only once)
  const hasShownWelcome = context.globalState.get('gode.welcomeShown', false);
  if (!hasShownWelcome) {
    vscode.window
      .showInformationMessage(
        '🎨🎵 GoDE installed! Features:\n• AI-controlled themes via MCP\n• 12 mood presets (Cyberpunk, Ocean Depths, etc.)\n• Audio player with mel spectrogram\n• Audio-reactive themes!\nCheck the Explorer sidebar for the Audio Player!',
        'Got it!',
        'Show Status'
      )
      .then((selection) => {
        if (selection === 'Show Status') {
          vscode.commands.executeCommand('gode.showStatus');
        }
      });
    context.globalState.update('gode.welcomeShown', true);
  }
}

/**
 * Extension deactivation - called when VSCode unloads the extension
 */
export async function deactivate() {
  console.log('GoDE extension is now deactivated');

  // Stop bridge server
  if (bridgeServer) {
    await bridgeServer.stop();
    bridgeServer = undefined;
  }
}
