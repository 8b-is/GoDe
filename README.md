# GoDE - AI Theme Control + Audio Visualizer

AI-controlled dynamic theme manipulation for VSCode via Model Context Protocol (MCP), now with audio-reactive themes and a mel spectrogram visualizer!

> "Finally, an AI that can fix my terrible color choices AND make them dance to music!" - Every developer, ever

## Features

### Core Theme Control
- **Natural Language Color Control**: AI assistants can manipulate theme colors through simple requests
- **Semantic Color Groups**: Organized color management (editor, sidebar, chat, terminal, etc.)
- **Real-Time Updates**: Changes apply instantly without reload
- **Accessibility Checking**: WCAG contrast validation built-in
- **Lazy Loading**: Efficient token usage with on-demand color group loading

### New in v0.1.0!

#### 🎨 12 Beautiful Mood Presets
Instantly transform your editor with professionally designed color schemes:

- **Ocean Depths** 🌊 - Deep blues and teals for calm, focused coding
- **Sunset Vibes** 🌅 - Warm oranges and purples for creative evening sessions
- **Forest Zen** 🌲 - Natural greens for peaceful, meditative coding
- **Midnight Purple** 🌙 - Rich purples and magentas for late-night hacking
- **Cyberpunk** 🤖 - Neon pinks and cyans for futuristic coding
- **Autumn Leaves** 🍂 - Warm browns and oranges for cozy coding
- **Arctic Ice** ❄️ - Cool blues and whites for crisp, clean focus
- **Lava Flow** 🌋 - Hot reds and oranges for intense coding sessions
- **Sakura Dreams** 🌸 - Soft pinks and whites for gentle, beautiful code
- **Matrix Code** 💚 - Classic green-on-black for that hacker aesthetic
- **Deep Space** 🌌 - Dark purples and blues with starry accents
- **Golden Hour** ✨ - Warm golds and soft yellows for inspired coding

#### 🎵 Audio Player with Mel Spectrogram
- Beautiful real-time mel spectrogram visualization
- 20ms rolling updates (as requested!)
- Supports any audio file format (MP3, WAV, OGG, etc.)
- Professional audio analysis with FFT
- Beat detection and tempo estimation

#### 🌈 Audio-Reactive Theming
- Your theme colors change dynamically with the music!
- Real-time color mapping from audio features:
  - **Frequency → Hue**: Bass creates cool colors, treble creates warm colors
  - **Energy → Saturation**: Louder music = more vibrant colors
  - **Brightness → Luminance**: High frequencies brighten the theme
  - **Beats → Flash**: Visual pulse on beat detection
- Smooth transitions with configurable smoothing
- Toggle on/off from the audio player

#### 🎨 Advanced Color Operations
- **Color Harmonies**: Generate analogous, complementary, triadic, tetradic, split-complementary, and square harmonies
- **Gradients**: Create smooth color gradients with any number of steps
- **Temperature Adjustment**: Make colors warmer or cooler
- **Accessibility Helper**: Automatically adjust colors to meet WCAG standards
- **Custom Mood Creator**: Generate a full theme from any base color

## Usage with AI Assistants

Once installed, AI assistants with MCP support can control your theme:

**Basic color control:**
- "Make the sidebar darker"
- "Show me all chat-related colors"
- "Set the editor background to pure black"
- "Reset all color customizations"

**Mood presets:**
- "Apply the Cyberpunk theme"
- "Show me all available mood presets"
- "Switch to Ocean Depths"
- "Create a custom mood from #ff6b9d"

**Advanced operations:**
- "Generate a complementary harmony from #3498db"
- "Create a gradient from blue to orange with 7 steps"
- "Make #e74c3c warmer by 30 degrees"
- "Ensure this text color is readable on dark background"

## MCP Tools

The extension provides 12 powerful tools for AI assistants:

### Basic Color Control

#### `listColorGroups`
See available color categories (editor, sidebar, chat, terminal, notifications, statusBar, git)

#### `getColorsInGroup`
Get all colors for a specific UI area with their current values

**Parameters:**
- `group` (string): Group name (e.g., "editor", "sidebar", "chat")

#### `setColor`
Change a specific color key to a new value

**Parameters:**
- `key` (string): Color key (e.g., "editor.background")
- `value` (string): Hex color value (e.g., "#ff00ff")

#### `getColor`
Get current value of a specific color key

**Parameters:**
- `key` (string): Color key (e.g., "editor.background")

#### `resetColors`
Reset all color customizations to theme defaults

### Mood Presets

#### `listMoodPresets`
List all 12 available mood presets with descriptions

#### `applyMoodPreset`
Apply a mood preset to instantly transform your theme

**Parameters:**
- `name` (string): Preset name (e.g., "Cyberpunk", "Ocean Depths")

#### `createCustomMood`
Create and apply a custom mood from any base color

**Parameters:**
- `baseColor` (string): Hex color value (e.g., "#ff00ff")
- `name` (string, optional): Custom name for the mood

### Advanced Color Operations

#### `generateColorHarmony`
Generate a color harmony scheme from a base color

**Parameters:**
- `baseColor` (string): Base color in hex format
- `harmonyType` (string): One of: analogous, complementary, triadic, tetradic, split-complementary, square

#### `generateGradient`
Create a smooth color gradient

**Parameters:**
- `startColor` (string): Starting color in hex format
- `endColor` (string): Ending color in hex format
- `steps` (number, optional): Number of colors in gradient (default: 10)

#### `adjustColorTemperature`
Make a color warmer (toward orange) or cooler (toward blue)

**Parameters:**
- `color` (string): Color to adjust in hex format
- `amount` (number): Temperature change (-100 to 100, negative = cooler, positive = warmer)

#### `ensureReadableColor`
Adjust a foreground color to meet WCAG readability standards

**Parameters:**
- `foreground` (string): Foreground color in hex format
- `background` (string): Background color in hex format
- `targetRatio` (number, optional): Target contrast ratio (4.5 for AA, 7.0 for AAA, default: 4.5)

## Audio Player

Find the **Audio Player & Visualizer** panel in your Explorer sidebar!

### Features:
- Load any audio file from your system
- Real-time mel spectrogram visualization (128 mel bins, 20ms updates)
- Play/Pause/Stop controls
- Audio analysis display (energy, brightness, BPM)
- Audio-reactive theme toggle

### Using Audio-Reactive Theming:
1. Open the Audio Player panel in the Explorer sidebar
2. Load an audio file
3. Enable "Audio-Reactive Theme" toggle
4. Press Play and watch your theme dance to the music!

## Installation

1. Install the extension from VSCode marketplace (or install from VSIX)
2. The extension activates automatically on startup
3. AI assistants (like GitHub Copilot) will automatically discover the MCP server
4. Start theming!

## Color Groups

### Editor (9 colors)
Main code editing area: background, foreground, cursor, selection, highlights, line numbers

### Sidebar (6 colors)
File explorer and side panels: background, foreground, titles, headers

### Chat (11 colors)
AI chat interface (Copilot, Claude, etc.): backgrounds, foregrounds, slash commands

### Terminal (10 colors)
Integrated terminal + ANSI colors: background, foreground, black, red, green, yellow, blue, magenta, cyan, white

### Notifications (7 colors)
Alerts, warnings, info messages and icons

### Status Bar (5 colors)
Bottom status bar: background, foreground, debugging states

### Git (5 colors)
Git status decorations: modified, deleted, untracked, added resources

## Technical Details

### Architecture
- **HTTP Bridge**: Extension host ↔ MCP server communication
- **Standalone MCP Server**: Runs as child process with stdio transport
- **Real-time Audio Analysis**: Web Audio API with FFT and mel filterbank
- **Color Science**: Professional color theory with tinycolor2
- **Accessibility**: WCAG contrast checking with wcag-contrast

### Audio Analysis
- **FFT Size**: 2048 samples
- **Mel Bins**: 128 (perceptually uniform frequency resolution)
- **Update Rate**: 20ms per spectrogram line
- **Features**: Energy, spectral centroid, beat detection, BPM estimation

### Dependencies
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `tinycolor2` - Color manipulation and math
- `wcag-contrast` - Accessibility validation

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Run in VSCode
Press F5 to launch Extension Development Host
```

## Changelog

### v0.1.0 (2025-11-09)
- 🎨 Added 12 beautiful mood presets
- 🎵 Added audio player with mel spectrogram visualization
- 🌈 Added audio-reactive theming
- ✨ Added 7 new MCP tools for advanced color operations
- 🎨 Color harmonies (analogous, complementary, triadic, etc.)
- 📊 Gradient generation
- 🌡️ Temperature adjustment (warmer/cooler)
- ♿ Automatic accessibility color adjustment
- 🎨 Custom mood preset generator

### v0.0.1
- Initial release
- 5 basic MCP tools
- Semantic color groups
- HTTP bridge architecture

## License

MIT

## Contributing

Contributions welcome! This extension is designed to make VSCode theming fun, creative, and accessible to everyone through AI assistance.

---

Made with 🎨 and 🎵 by the 8b team
