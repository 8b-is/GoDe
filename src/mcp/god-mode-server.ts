import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VSCodeConfig } from '../vscode/config';
import { ColorManipulator } from '../colors/manipulation';
import colorGroupsData from '../../data/color-groups.json';
import { ColorGroups } from '../colors/groups';
import { WorkspaceController } from '../workspace/WorkspaceController';
import { EditorController } from '../editor/EditorController';
import { TerminalController } from '../terminal/TerminalController';
import { VisualEffectsController } from '../effects/VisualEffects';
import { ThemeHistoryManager } from '../themes/ThemeHistory';

/**
 * GodModeMCPServer - Complete VSCode control through MCP
 *
 * God Mode for VSCode - Control everything through AI chat:
 * - Theme manipulation with audio reactivity
 * - Workspace operations (files, folders, tasks)
 * - Editor control (tabs, splits, navigation)
 * - Terminal management
 * - Visual effects (matrix rain, particles, glitch, etc.)
 * - And much more!
 */
export class GodModeMCPServer {
  private server: Server;
  private vscodeConfig: VSCodeConfig;
  private colorManipulator: ColorManipulator;
  private colorGroups: ColorGroups;
  private workspaceController: WorkspaceController;
  private editorController: EditorController;
  private terminalController: TerminalController;
  private effectsController: VisualEffectsController;
  private historyManager: ThemeHistoryManager;

  constructor() {
    // Initialize MCP server with metadata
    this.server = new Server(
      {
        name: 'gode',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize all controllers
    this.vscodeConfig = new VSCodeConfig();
    this.colorManipulator = new ColorManipulator();
    this.colorGroups = colorGroupsData as ColorGroups;
    this.workspaceController = new WorkspaceController();
    this.editorController = new EditorController();
    this.terminalController = new TerminalController();
    this.effectsController = new VisualEffectsController();
    this.historyManager = new ThemeHistoryManager();

    // Set up MCP request handlers
    this.setupHandlers();
  }

  /**
   * Configure MCP request handlers for tool listing and execution
   */
  private setupHandlers() {
    // List available tools - the full God Mode arsenal!
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // === THEME CONTROL ===
        {
          name: 'listColorGroups',
          description: 'List available semantic color groups (editor, sidebar, chat, etc.)',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'getColorsInGroup',
          description: 'Get all color keys and current values for a specific group',
          inputSchema: {
            type: 'object',
            properties: {
              group: { type: 'string', description: 'Group name (editor, sidebar, chat, etc.)' },
            },
            required: ['group'],
          },
        },
        {
          name: 'setColor',
          description: 'Set a specific color key to a hex value',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Color key (e.g., "editor.background")' },
              value: { type: 'string', description: 'Hex color value (e.g., "#ff00ff")' },
            },
            required: ['key', 'value'],
          },
        },
        {
          name: 'getColor',
          description: 'Get the current value of a specific color key',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Color key (e.g., "editor.background")' },
            },
            required: ['key'],
          },
        },
        {
          name: 'resetColors',
          description: 'Reset all color customizations to theme defaults',
          inputSchema: { type: 'object', properties: {} },
        },

        // === WORKSPACE CONTROL ===
        {
          name: 'listFiles',
          description: 'List all files in workspace with optional glob pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.ts")' },
              maxDepth: { type: 'number', description: 'Maximum depth to search (default: 5)' },
            },
          },
        },
        {
          name: 'getWorkspaceTree',
          description: 'Get workspace structure as a tree',
          inputSchema: {
            type: 'object',
            properties: {
              maxDepth: { type: 'number', description: 'Maximum depth (default: 3)' },
            },
          },
        },
        {
          name: 'createFile',
          description: 'Create a new file with optional content',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative path to create' },
              content: { type: 'string', description: 'File content (optional)' },
            },
            required: ['path'],
          },
        },
        {
          name: 'deleteFile',
          description: 'Delete a file or folder (moves to trash)',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative path to delete' },
            },
            required: ['path'],
          },
        },
        {
          name: 'renameFile',
          description: 'Rename or move a file/folder',
          inputSchema: {
            type: 'object',
            properties: {
              oldPath: { type: 'string', description: 'Current path' },
              newPath: { type: 'string', description: 'New path' },
            },
            required: ['oldPath', 'newPath'],
          },
        },
        {
          name: 'listTasks',
          description: 'Get all tasks defined in workspace',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'runTask',
          description: 'Execute a workspace task by name',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Task name' },
            },
            required: ['name'],
          },
        },
        {
          name: 'searchWorkspace',
          description: 'Search for text in workspace files',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              includePattern: { type: 'string', description: 'Include pattern (optional)' },
              excludePattern: { type: 'string', description: 'Exclude pattern (optional)' },
              maxResults: { type: 'number', description: 'Max results (default: 100)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'getWorkspaceInfo',
          description: 'Get information about the current workspace',
          inputSchema: { type: 'object', properties: {} },
        },

        // === EDITOR CONTROL ===
        {
          name: 'getOpenEditors',
          description: 'List all open editor tabs',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'openFile',
          description: 'Open a file in the editor',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative file path' },
              viewColumn: { type: 'number', description: 'View column (1-9, optional)' },
              preview: { type: 'boolean', description: 'Open as preview (default: true)' },
            },
            required: ['path'],
          },
        },
        {
          name: 'closeEditor',
          description: 'Close an editor tab (or active if no path specified)',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: { type: 'string', description: 'File name to close (optional)' },
            },
          },
        },
        {
          name: 'closeAllEditors',
          description: 'Close all open editor tabs',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'splitEditor',
          description: 'Split the editor view',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Split direction' },
            },
          },
        },
        {
          name: 'navigateEditor',
          description: 'Navigate between open editors',
          inputSchema: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['next', 'previous', 'first', 'last'] },
            },
            required: ['direction'],
          },
        },
        {
          name: 'getActiveEditor',
          description: 'Get information about the currently active editor',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'insertText',
          description: 'Insert text at cursor position in active editor',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to insert' },
            },
            required: ['text'],
          },
        },
        {
          name: 'goToLine',
          description: 'Jump to a specific line number',
          inputSchema: {
            type: 'object',
            properties: {
              line: { type: 'number', description: 'Line number' },
            },
            required: ['line'],
          },
        },
        {
          name: 'formatDocument',
          description: 'Format the active document',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'toggleZenMode',
          description: 'Toggle zen mode for distraction-free coding',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'setFontSize',
          description: 'Change editor font size',
          inputSchema: {
            type: 'object',
            properties: {
              size: { type: 'number', description: 'Font size (6-100)' },
            },
            required: ['size'],
          },
        },

        // === TERMINAL CONTROL ===
        {
          name: 'listTerminals',
          description: 'List all open terminals',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'createTerminal',
          description: 'Create a new terminal',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Terminal name' },
              cwd: { type: 'string', description: 'Working directory' },
            },
          },
        },
        {
          name: 'executeCommand',
          description: 'Execute a command in a terminal',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' },
              terminalId: { type: 'number', description: 'Terminal ID (optional, creates new if not provided)' },
            },
            required: ['command'],
          },
        },
        {
          name: 'closeTerminal',
          description: 'Close a terminal by ID',
          inputSchema: {
            type: 'object',
            properties: {
              terminalId: { type: 'number', description: 'Terminal ID' },
            },
            required: ['terminalId'],
          },
        },
        {
          name: 'clearTerminal',
          description: 'Clear terminal output',
          inputSchema: {
            type: 'object',
            properties: {
              terminalId: { type: 'number', description: 'Terminal ID (optional, clears active if not provided)' },
            },
          },
        },

        // === VISUAL EFFECTS ===
        {
          name: 'startEffect',
          description: 'Start a visual effect (matrix-rain, neon-pulse, glitch, particles, starfield, plasma, wave)',
          inputSchema: {
            type: 'object',
            properties: {
              effect: {
                type: 'string',
                enum: ['matrix-rain', 'neon-pulse', 'glitch', 'particles', 'code-rain', 'starfield', 'plasma', 'wave'],
                description: 'Effect type'
              },
              intensity: { type: 'number', description: 'Effect intensity (0-100, default: 50)' },
              speed: { type: 'number', description: 'Effect speed (0-100, default: 50)' },
              duration: { type: 'number', description: 'Duration in ms (0 = infinite)' },
              colors: { type: 'array', items: { type: 'string' }, description: 'Custom colors for effect' },
            },
            required: ['effect'],
          },
        },
        {
          name: 'stopEffect',
          description: 'Stop a running effect by ID',
          inputSchema: {
            type: 'object',
            properties: {
              effectId: { type: 'string', description: 'Effect ID returned by startEffect' },
            },
            required: ['effectId'],
          },
        },
        {
          name: 'stopAllEffects',
          description: 'Stop all running visual effects',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'listEffects',
          description: 'List available visual effects',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'getActiveEffects',
          description: 'Get list of currently running effects',
          inputSchema: { type: 'object', properties: {} },
        },

        // === THEME HISTORY ===
        {
          name: 'undoTheme',
          description: 'Undo to previous theme state',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'redoTheme',
          description: 'Redo to next theme state',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'getThemeHistory',
          description: 'Get theme change history',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    // Handle tool calls - route to appropriate handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Theme controls
          case 'listColorGroups':
            return this.handleListColorGroups();
          case 'getColorsInGroup':
            return this.handleGetColorsInGroup(args?.group as string);
          case 'setColor':
            return this.handleSetColor(args?.key as string, args?.value as string);
          case 'getColor':
            return this.handleGetColor(args?.key as string);
          case 'resetColors':
            return this.handleResetColors();

          // Workspace controls
          case 'listFiles':
            return this.handleListFiles(args?.pattern as string, args?.maxDepth as number);
          case 'getWorkspaceTree':
            return this.handleGetWorkspaceTree(args?.maxDepth as number);
          case 'createFile':
            return this.handleCreateFile(args?.path as string, args?.content as string);
          case 'deleteFile':
            return this.handleDeleteFile(args?.path as string);
          case 'renameFile':
            return this.handleRenameFile(args?.oldPath as string, args?.newPath as string);
          case 'listTasks':
            return this.handleListTasks();
          case 'runTask':
            return this.handleRunTask(args?.name as string);
          case 'searchWorkspace':
            return this.handleSearchWorkspace(args as any);
          case 'getWorkspaceInfo':
            return this.handleGetWorkspaceInfo();

          // Editor controls
          case 'getOpenEditors':
            return this.handleGetOpenEditors();
          case 'openFile':
            return this.handleOpenFile(args as any);
          case 'closeEditor':
            return this.handleCloseEditor(args?.fileName as string);
          case 'closeAllEditors':
            return this.handleCloseAllEditors();
          case 'splitEditor':
            return this.handleSplitEditor(args?.direction as any);
          case 'navigateEditor':
            return this.handleNavigateEditor(args?.direction as any);
          case 'getActiveEditor':
            return this.handleGetActiveEditor();
          case 'insertText':
            return this.handleInsertText(args?.text as string);
          case 'goToLine':
            return this.handleGoToLine(args?.line as number);
          case 'formatDocument':
            return this.handleFormatDocument();
          case 'toggleZenMode':
            return this.handleToggleZenMode();
          case 'setFontSize':
            return this.handleSetFontSize(args?.size as number);

          // Terminal controls
          case 'listTerminals':
            return this.handleListTerminals();
          case 'createTerminal':
            return this.handleCreateTerminal(args as any);
          case 'executeCommand':
            return this.handleExecuteCommand(args as any);
          case 'closeTerminal':
            return this.handleCloseTerminal(args?.terminalId as number);
          case 'clearTerminal':
            return this.handleClearTerminal(args?.terminalId as number);

          // Visual effects
          case 'startEffect':
            return this.handleStartEffect(args as any);
          case 'stopEffect':
            return this.handleStopEffect(args?.effectId as string);
          case 'stopAllEffects':
            return this.handleStopAllEffects();
          case 'listEffects':
            return this.handleListEffects();
          case 'getActiveEffects':
            return this.handleGetActiveEffects();

          // Theme history
          case 'undoTheme':
            return this.handleUndoTheme();
          case 'redoTheme':
            return this.handleRedoTheme();
          case 'getThemeHistory':
            return this.handleGetThemeHistory();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  // ==================== THEME HANDLERS ====================

  private async handleListColorGroups() {
    const groups = Object.entries(this.colorGroups).map(([id, group]) => ({
      id,
      name: group.name,
      description: group.description,
      keyCount: group.keys.length,
    }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ groups }, null, 2) }],
    };
  }

  private async handleGetColorsInGroup(groupId: string) {
    const group = this.colorGroups[groupId];
    if (!group) {
      throw new Error(`Unknown color group: ${groupId}`);
    }

    const currentColors = await this.vscodeConfig.getCurrentColors();
    const colors: Record<string, string | undefined> = {};

    for (const key of group.keys) {
      colors[key] = currentColors[key];
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ group: group.name, description: group.description, colors }, null, 2)
      }],
    };
  }

  private async handleSetColor(key: string, value: string) {
    if (!this.colorManipulator.isValidColor(value)) {
      throw new Error(`Invalid color value: ${value}`);
    }

    const oldValue = await this.vscodeConfig.getColor(key);
    await this.vscodeConfig.setColor(key, value);

    // Track in history
    const currentColors = await this.vscodeConfig.getCurrentColors();
    this.historyManager.addSnapshot(currentColors, `Set ${key} to ${value}`);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, key, oldValue, newValue: value }, null, 2)
      }],
    };
  }

  private async handleGetColor(key: string) {
    const value = await this.vscodeConfig.getColor(key);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ key, value: value || null }, null, 2)
      }],
    };
  }

  private async handleResetColors() {
    await this.vscodeConfig.resetAllColors();
    this.historyManager.clear();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'All color customizations reset' }, null, 2)
      }],
    };
  }

  // ==================== WORKSPACE HANDLERS ====================

  private async handleListFiles(pattern?: string, maxDepth?: number) {
    const files = await this.workspaceController.listFiles(pattern, maxDepth);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ files, count: files.length }, null, 2)
      }],
    };
  }

  private async handleGetWorkspaceTree(maxDepth?: number) {
    const tree = await this.workspaceController.getWorkspaceTree(maxDepth);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ tree }, null, 2)
      }],
    };
  }

  private async handleCreateFile(path: string, content?: string) {
    await this.workspaceController.createFile(path, content);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, path, message: 'File created' }, null, 2)
      }],
    };
  }

  private async handleDeleteFile(path: string) {
    await this.workspaceController.delete(path);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, path, message: 'File deleted' }, null, 2)
      }],
    };
  }

  private async handleRenameFile(oldPath: string, newPath: string) {
    await this.workspaceController.rename(oldPath, newPath);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, oldPath, newPath, message: 'File renamed' }, null, 2)
      }],
    };
  }

  private async handleListTasks() {
    const tasks = await this.workspaceController.listTasks();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ tasks, count: tasks.length }, null, 2)
      }],
    };
  }

  private async handleRunTask(name: string) {
    await this.workspaceController.runTask(name);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, task: name, message: 'Task started' }, null, 2)
      }],
    };
  }

  private async handleSearchWorkspace(args: any) {
    const results = await this.workspaceController.searchText(args.query, args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ results, count: results.length }, null, 2)
      }],
    };
  }

  private async handleGetWorkspaceInfo() {
    const info = this.workspaceController.getWorkspaceInfo();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(info, null, 2)
      }],
    };
  }

  // ==================== EDITOR HANDLERS ====================

  private async handleGetOpenEditors() {
    const editors = this.editorController.getOpenEditors();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ editors, count: editors.length }, null, 2)
      }],
    };
  }

  private async handleOpenFile(args: any) {
    await this.editorController.openFile(args.path, args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, path: args.path }, null, 2)
      }],
    };
  }

  private async handleCloseEditor(fileName?: string) {
    await this.editorController.closeEditor(fileName);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Editor closed' }, null, 2)
      }],
    };
  }

  private async handleCloseAllEditors() {
    await this.editorController.closeAllEditors();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'All editors closed' }, null, 2)
      }],
    };
  }

  private async handleSplitEditor(direction: 'horizontal' | 'vertical') {
    await this.editorController.splitEditor(direction);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, direction }, null, 2)
      }],
    };
  }

  private async handleNavigateEditor(direction: 'next' | 'previous' | 'first' | 'last') {
    await this.editorController.navigateEditor(direction);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, direction }, null, 2)
      }],
    };
  }

  private async handleGetActiveEditor() {
    const editor = this.editorController.getActiveEditor();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ editor }, null, 2)
      }],
    };
  }

  private async handleInsertText(text: string) {
    await this.editorController.insertText(text);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Text inserted' }, null, 2)
      }],
    };
  }

  private async handleGoToLine(line: number) {
    await this.editorController.goToLine(line);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, line }, null, 2)
      }],
    };
  }

  private async handleFormatDocument() {
    await this.editorController.formatDocument();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Document formatted' }, null, 2)
      }],
    };
  }

  private async handleToggleZenMode() {
    await this.editorController.toggleZenMode();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Zen mode toggled' }, null, 2)
      }],
    };
  }

  private async handleSetFontSize(size: number) {
    await this.editorController.setFontSize(size);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, fontSize: size }, null, 2)
      }],
    };
  }

  // ==================== TERMINAL HANDLERS ====================

  private async handleListTerminals() {
    const terminals = await this.terminalController.listTerminals();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ terminals, count: terminals.length }, null, 2)
      }],
    };
  }

  private async handleCreateTerminal(args: any) {
    const id = this.terminalController.createTerminal(args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, terminalId: id }, null, 2)
      }],
    };
  }

  private async handleExecuteCommand(args: any) {
    const terminalId = await this.terminalController.execute(args.command, args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, terminalId, command: args.command }, null, 2)
      }],
    };
  }

  private async handleCloseTerminal(terminalId: number) {
    this.terminalController.dispose(terminalId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, terminalId, message: 'Terminal closed' }, null, 2)
      }],
    };
  }

  private async handleClearTerminal(terminalId?: number) {
    this.terminalController.clear(terminalId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'Terminal cleared' }, null, 2)
      }],
    };
  }

  // ==================== VISUAL EFFECTS HANDLERS ====================

  private async handleStartEffect(args: any) {
    const effectId = await this.effectsController.startEffect(args.effect, args);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, effectId, effect: args.effect }, null, 2)
      }],
    };
  }

  private async handleStopEffect(effectId: string) {
    this.effectsController.stopEffect(effectId);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, effectId, message: 'Effect stopped' }, null, 2)
      }],
    };
  }

  private async handleStopAllEffects() {
    this.effectsController.stopAllEffects();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, message: 'All effects stopped' }, null, 2)
      }],
    };
  }

  private async handleListEffects() {
    const effects = this.effectsController.listEffects();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ effects }, null, 2)
      }],
    };
  }

  private async handleGetActiveEffects() {
    const activeEffects = this.effectsController.getActiveEffects();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ activeEffects, count: activeEffects.length }, null, 2)
      }],
    };
  }

  // ==================== THEME HISTORY HANDLERS ====================

  private async handleUndoTheme() {
    const success = await this.historyManager.undo();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success, message: success ? 'Theme undone' : 'Nothing to undo' }, null, 2)
      }],
    };
  }

  private async handleRedoTheme() {
    const success = await this.historyManager.redo();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success, message: success ? 'Theme redone' : 'Nothing to redo' }, null, 2)
      }],
    };
  }

  private async handleGetThemeHistory() {
    const history = this.historyManager.getHistory();
    const info = this.historyManager.getHistoryInfo();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ history, info }, null, 2)
      }],
    };
  }

  /**
   * Start the MCP server with stdio transport
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GoDE God Mode server started - Full VSCode control activated!');
  }
}
