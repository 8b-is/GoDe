/**
 * Standalone MCP Server - Entry point for separate process
 *
 * This file is the entry point when VSCode spawns the MCP server as a child process.
 * It MUST NOT import 'vscode' module since it runs outside the extension host.
 *
 * Instead, it uses BridgeClient to communicate with the extension host via HTTP,
 * which then calls VSCode APIs on our behalf.
 *
 * Architecture:
 * - VSCode spawns this as a child process when GitHub Copilot connects
 * - Communicates with Copilot via stdio (stdin/stdout) using MCP protocol
 * - Communicates with extension host via HTTP bridge on localhost
 * - Extension host makes actual VSCode API calls on our behalf
 *
 * Key Features:
 * - 5 MCP tools for theme color manipulation
 * - Color validation before setting values
 * - Semantic color groups for intuitive control
 * - Comprehensive error handling and logging
 *
 * This is spawned by the extension when GitHub Copilot requests the MCP server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BridgeClient } from '../bridge/client';
import { ColorManipulator } from '../colors/manipulation';
import { AdvancedColorOps } from '../colors/advanced';
import { MoodPresetsManager } from '../themes/MoodPresets';
import * as colorGroupsData from '../../data/color-groups.json';
import { ColorGroups } from '../colors/groups';

/**
 * Main server initialization and startup
 *
 * Sets up:
 * 1. Bridge client (HTTP connection to extension host)
 * 2. Color utilities (no vscode dependency)
 * 3. MCP server with stdio transport
 * 4. Tool handlers for all 5 MCP tools
 */
async function main() {
  // Initialize bridge client (HTTP to extension host)
  // This will throw if BRIDGE_PORT env var is not set
  const bridge = new BridgeClient();

  // Initialize color utilities (no vscode dependency)
  const colorManipulator = new ColorManipulator();
  const colorGroups: ColorGroups = colorGroupsData as ColorGroups;

  // Create MCP server with metadata
  const server = new Server(
    {
      name: 'gode',
      version: '0.0.1',
    },
    {
      capabilities: {
        tools: {}, // We support tool calls
      },
    }
  );

  /**
   * List available tools
   *
   * Returns schema for all 5 tools:
   * 1. listColorGroups - List semantic color groups
   * 2. getColorsInGroup - Get all colors in a specific group
   * 3. setColor - Set a specific color key
   * 4. getColor - Get a specific color key value
   * 5. resetColors - Reset all color customizations
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'listColorGroups',
        description: 'List available semantic color groups (editor, sidebar, chat, terminal, etc.) with descriptions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'getColorsInGroup',
        description: 'Get all color keys and current values for a specific group (e.g., "editor", "sidebar")',
        inputSchema: {
          type: 'object',
          properties: {
            group: {
              type: 'string',
              description: 'Group name (e.g., "editor", "sidebar", "chat", "terminal")',
            },
          },
          required: ['group'],
        },
      },
      {
        name: 'setColor',
        description: 'Set a specific VSCode color key to a hex value (e.g., editor.background to #1a1a1a)',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Color key (e.g., "editor.background", "sideBar.foreground")',
            },
            value: {
              type: 'string',
              description: 'Hex color value (e.g., "#ff00ff", "#1a1a1a")',
            },
          },
          required: ['key', 'value'],
        },
      },
      {
        name: 'getColor',
        description: 'Get the current value of a specific VSCode color key',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Color key (e.g., "editor.background", "sideBar.foreground")',
            },
          },
          required: ['key'],
        },
      },
      {
        name: 'resetColors',
        description: 'Reset all color customizations to theme defaults (removes all workbench.colorCustomizations)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'listMoodPresets',
        description: 'List all available mood presets for quick theme changes (Ocean Depths, Sunset Vibes, Cyberpunk, etc.)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'applyMoodPreset',
        description: 'Apply a mood preset to instantly change the entire theme (e.g., "Cyberpunk", "Ocean Depths")',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the mood preset to apply',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'generateColorHarmony',
        description: 'Generate a color harmony (analogous, complementary, triadic, etc.) from a base color',
        inputSchema: {
          type: 'object',
          properties: {
            baseColor: {
              type: 'string',
              description: 'Base color in hex format (e.g., "#ff00ff")',
            },
            harmonyType: {
              type: 'string',
              enum: ['analogous', 'complementary', 'triadic', 'tetradic', 'split-complementary', 'square'],
              description: 'Type of color harmony to generate',
            },
          },
          required: ['baseColor', 'harmonyType'],
        },
      },
      {
        name: 'generateGradient',
        description: 'Generate a smooth color gradient between two colors',
        inputSchema: {
          type: 'object',
          properties: {
            startColor: {
              type: 'string',
              description: 'Starting color in hex format',
            },
            endColor: {
              type: 'string',
              description: 'Ending color in hex format',
            },
            steps: {
              type: 'number',
              description: 'Number of colors in the gradient (default: 10)',
            },
          },
          required: ['startColor', 'endColor'],
        },
      },
      {
        name: 'adjustColorTemperature',
        description: 'Make a color warmer (orange) or cooler (blue) by adjusting temperature',
        inputSchema: {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              description: 'Color to adjust in hex format',
            },
            amount: {
              type: 'number',
              description: 'Temperature adjustment (-100 to 100, negative = cooler, positive = warmer)',
            },
          },
          required: ['color', 'amount'],
        },
      },
      {
        name: 'ensureReadableColor',
        description: 'Adjust a foreground color to ensure it meets WCAG readability standards against a background',
        inputSchema: {
          type: 'object',
          properties: {
            foreground: {
              type: 'string',
              description: 'Foreground color in hex format',
            },
            background: {
              type: 'string',
              description: 'Background color in hex format',
            },
            targetRatio: {
              type: 'number',
              description: 'Target contrast ratio (4.5 for AA, 7.0 for AAA, default: 4.5)',
            },
          },
          required: ['foreground', 'background'],
        },
      },
      {
        name: 'createCustomMood',
        description: 'Create a custom mood preset from a base color and apply it',
        inputSchema: {
          type: 'object',
          properties: {
            baseColor: {
              type: 'string',
              description: 'Base color for the mood in hex format',
            },
            name: {
              type: 'string',
              description: 'Name for the custom mood (default: "Custom Mood")',
            },
          },
          required: ['baseColor'],
        },
      },
    ],
  }));

  /**
   * Handle tool calls
   *
   * Routes each tool to its implementation:
   * - listColorGroups: Returns semantic groups from color-groups.json
   * - getColorsInGroup: Uses bridge to get current colors from VSCode
   * - setColor: Validates color, then uses bridge to set via VSCode API
   * - getColor: Uses bridge to get value via VSCode API
   * - resetColors: Uses bridge to reset all via VSCode API
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'listColorGroups': {
        // Return semantic color groups with metadata
        // This doesn't need VSCode API - just returns static data
        const groups = Object.entries(colorGroups).map(([id, group]) => ({
          id,
          name: group.name,
          description: group.description,
          keyCount: group.keys.length,
          commonIntents: group.commonIntents,
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

      case 'getColorsInGroup': {
        // Get all colors in a specific group with current values
        if (!args) {throw new Error('Missing arguments for getColorsInGroup');}
        const groupId = args.group as string;

        const group = colorGroups[groupId];
        if (!group) {
          throw new Error(`Unknown color group: ${groupId}. Available groups: ${Object.keys(colorGroups).join(', ')}`);
        }

        // Use bridge to get current colors from VSCode
        const currentColors = await bridge.getCurrentColors();
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

      case 'setColor': {
        // Set a specific color key to a new value
        if (!args) {throw new Error('Missing arguments for setColor');}
        const key = args.key as string;
        const value = args.value as string;

        // Validate color format before sending to VSCode
        if (!colorManipulator.isValidColor(value)) {
          throw new Error(`Invalid color value: ${value}. Must be a valid hex color (e.g., "#ff00ff")`);
        }

        // Get old value via bridge (for logging/response)
        const oldValue = await bridge.getColor(key);

        // Set new color via bridge
        await bridge.setColor(key, value);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  key,
                  oldValue: oldValue || null,
                  newValue: value,
                  message: `Color '${key}' updated successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'getColor': {
        // Get the current value of a specific color key
        if (!args) {throw new Error('Missing arguments for getColor');}
        const key = args.key as string;

        // Get color via bridge
        const value = await bridge.getColor(key);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  key,
                  value: value || null,
                  isSet: value !== undefined,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'resetColors': {
        // Reset all color customizations to theme defaults
        await bridge.resetAllColors();

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

      case 'listMoodPresets': {
        // List all available mood presets
        const presets = MoodPresetsManager.getAllPresets();
        const presetList = presets.map(p => ({
          name: p.name,
          description: p.description,
          emoji: p.emoji,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  presets: presetList,
                  count: presetList.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'applyMoodPreset': {
        // Apply a mood preset
        if (!args) {throw new Error('Missing arguments for applyMoodPreset');}
        const presetName = args.name as string;

        const preset = MoodPresetsManager.getPreset(presetName);
        if (!preset) {
          const available = MoodPresetsManager.getAllPresets().map(p => p.name).join(', ');
          throw new Error(`Unknown mood preset: ${presetName}. Available: ${available}`);
        }

        // Apply all colors via bridge
        await bridge.setColors(preset.colors);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  preset: preset.name,
                  description: preset.description,
                  emoji: preset.emoji,
                  colorsApplied: Object.keys(preset.colors).length,
                  message: `${preset.emoji} ${preset.name} theme applied! ${preset.description}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generateColorHarmony': {
        // Generate color harmony from base color
        if (!args) {throw new Error('Missing arguments for generateColorHarmony');}
        const baseColor = args.baseColor as string;
        const harmonyType = args.harmonyType as 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary' | 'square';

        const harmony = AdvancedColorOps.generateHarmony(baseColor, harmonyType);
        if (!harmony) {
          throw new Error(`Invalid base color: ${baseColor}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  harmonyType: harmony.name,
                  baseColor,
                  colors: harmony.colors,
                  count: harmony.colors.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generateGradient': {
        // Generate color gradient
        if (!args) {throw new Error('Missing arguments for generateGradient');}
        const startColor = args.startColor as string;
        const endColor = args.endColor as string;
        const steps = (args.steps as number) || 10;

        const gradient = AdvancedColorOps.generateGradient(startColor, endColor, steps);
        if (gradient.length === 0) {
          throw new Error(`Invalid colors or steps: ${startColor}, ${endColor}, ${steps}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  startColor,
                  endColor,
                  steps,
                  gradient,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'adjustColorTemperature': {
        // Adjust color temperature
        if (!args) {throw new Error('Missing arguments for adjustColorTemperature');}
        const color = args.color as string;
        const amount = args.amount as number;

        const adjusted = AdvancedColorOps.adjustTemperature(color, amount);
        if (!adjusted) {
          throw new Error(`Invalid color: ${color}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  originalColor: color,
                  adjustedColor: adjusted,
                  temperatureChange: amount,
                  direction: amount > 0 ? 'warmer' : 'cooler',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'ensureReadableColor': {
        // Ensure color readability
        if (!args) {throw new Error('Missing arguments for ensureReadableColor');}
        const foreground = args.foreground as string;
        const background = args.background as string;
        const targetRatio = (args.targetRatio as number) || 4.5;

        const readable = AdvancedColorOps.ensureReadability(foreground, background, targetRatio);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  originalForeground: foreground,
                  adjustedForeground: readable,
                  background,
                  targetRatio,
                  wcagLevel: targetRatio >= 7 ? 'AAA' : 'AA',
                  wasAdjusted: foreground !== readable,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'createCustomMood': {
        // Create and apply custom mood preset
        if (!args) {throw new Error('Missing arguments for createCustomMood');}
        const baseColor = args.baseColor as string;
        const name = (args.name as string) || 'Custom Mood';

        const preset = MoodPresetsManager.createCustomMood(name, baseColor);
        if (!preset) {
          throw new Error(`Invalid base color: ${baseColor}`);
        }

        // Apply the custom mood
        await bridge.setColors(preset.colors);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  preset: preset.name,
                  baseColor,
                  colorsApplied: Object.keys(preset.colors).length,
                  message: `${preset.emoji} Custom mood "${preset.name}" created and applied!`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}. Use listTools to see available tools.`);
    }
  });

  // Start MCP server with stdio transport
  // This connects to GitHub Copilot via stdin/stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('GoDE standalone server started via HTTP bridge');
  console.error(`Bridge URL: ${process.env.BRIDGE_PORT ? `http://127.0.0.1:${process.env.BRIDGE_PORT}` : 'NOT SET'}`);
}

/**
 * Run the server
 *
 * Catches fatal errors and exits with non-zero code to signal failure to parent process
 */
main().catch((error) => {
  console.error('Fatal error starting standalone MCP server:', error);
  process.exit(1);
});
