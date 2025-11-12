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

/**
 * ThemeMCPServer - MCP server for AI-controlled theme manipulation
 *
 * Provides 5 core tools for VSCode theme customization:
 * - listColorGroups: See all available semantic color groups
 * - getColorsInGroup: Get colors for a specific UI area (editor, sidebar, etc.)
 * - setColor: Change a specific color key
 * - getColor: Get current value of a color key
 * - resetColors: Reset all customizations to theme defaults
 *
 * This server uses stdio transport and integrates directly with VSCode's
 * workbench.colorCustomizations API for real-time theme updates.
 */
export class ThemeMCPServer {
  private server: Server;
  private vscodeConfig: VSCodeConfig;
  private colorManipulator: ColorManipulator;
  private colorGroups: ColorGroups;

  constructor() {
    // Initialize MCP server with metadata
    this.server = new Server(
      {
        name: 'gode',
        version: '0.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize our helper classes
    this.vscodeConfig = new VSCodeConfig();
    this.colorManipulator = new ColorManipulator();
    this.colorGroups = colorGroupsData as ColorGroups;

    // Set up MCP request handlers
    this.setupHandlers();
  }

  /**
   * Configure MCP request handlers for tool listing and execution
   */
  private setupHandlers() {
    // List available tools - called by AI assistants to discover capabilities
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'listColorGroups',
          description: 'List available semantic color groups (editor, sidebar, chat, etc.)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'getColorsInGroup',
          description: 'Get all color keys and current values for a specific group',
          inputSchema: {
            type: 'object',
            properties: {
              group: {
                type: 'string',
                description: 'Group name (e.g., "editor", "sidebar", "chat")',
              },
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
              key: {
                type: 'string',
                description: 'Color key (e.g., "editor.background")',
              },
              value: {
                type: 'string',
                description: 'Hex color value (e.g., "#ff00ff")',
              },
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
              key: {
                type: 'string',
                description: 'Color key (e.g., "editor.background")',
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'resetColors',
          description: 'Reset all color customizations to theme defaults',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls - route to appropriate handler based on tool name
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'listColorGroups':
          return this.handleListColorGroups();
        case 'getColorsInGroup':
          if (!args) throw new Error('Missing arguments for getColorsInGroup');
          return this.handleGetColorsInGroup(args.group as string);
        case 'setColor':
          if (!args) throw new Error('Missing arguments for setColor');
          return this.handleSetColor(args.key as string, args.value as string);
        case 'getColor':
          if (!args) throw new Error('Missing arguments for getColor');
          return this.handleGetColor(args.key as string);
        case 'resetColors':
          return this.handleResetColors();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  /**
   * Handler: List all available color groups
   * Returns high-level overview of semantic groupings
   */
  private async handleListColorGroups() {
    const groups = Object.entries(this.colorGroups).map(([id, group]) => ({
      id,
      name: group.name,
      description: group.description,
      keyCount: group.keys.length,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ groups }, null, 2),
        },
      ],
    };
  }

  /**
   * Handler: Get all colors in a specific group
   * Returns color keys with their current values
   */
  private async handleGetColorsInGroup(groupId: string) {
    const group = this.colorGroups[groupId];
    if (!group) {
      throw new Error(`Unknown color group: ${groupId}`);
    }

    // Fetch current color customizations
    const currentColors = await this.vscodeConfig.getCurrentColors();
    const colors: Record<string, string | undefined> = {};

    // Map group keys to their current values
    for (const key of group.keys) {
      colors[key] = currentColors[key];
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              group: group.name,
              description: group.description,
              colors,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handler: Set a specific color key
   * Validates color before applying
   */
  private async handleSetColor(key: string, value: string) {
    // Validate color format using tinycolor2
    if (!this.colorManipulator.isValidColor(value)) {
      throw new Error(`Invalid color value: ${value}`);
    }

    // Get old value for change tracking
    const oldValue = await this.vscodeConfig.getColor(key);

    // Apply the color change
    await this.vscodeConfig.setColor(key, value);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              key,
              oldValue,
              newValue: value,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handler: Get current value of a specific color key
   */
  private async handleGetColor(key: string) {
    const value = await this.vscodeConfig.getColor(key);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              key,
              value: value || null,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Handler: Reset all color customizations
   * Returns theme to default state
   */
  private async handleResetColors() {
    await this.vscodeConfig.resetAllColors();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: 'All color customizations reset to theme defaults',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Start the MCP server with stdio transport
   * Called by VSCode extension on activation
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GoDE server started');
  }
}
