# Change Log

All notable changes to the "GoDe" extension will be documented in this file.

## [0.0.1] - 2025-11-07

### Added
- Initial MCP server implementation with stdio transport
- 5 core tools for theme manipulation:
  - `listColorGroups` - Browse available semantic groups
  - `getColorsInGroup` - View colors in specific UI areas
  - `setColor` - Change individual color keys
  - `getColor` - Query current color values
  - `resetColors` - Reset all customizations
- Semantic color grouping system (7 groups covering 53 color keys)
- VSCode configuration integration for real-time updates
- Color manipulation utilities:
  - Brightness and saturation adjustment
  - Hue shifting and color wheel operations
  - Complementary and analogous color generation
  - Color mixing and validation
- WCAG accessibility checking (AA/AAA compliance)
- Comprehensive TypeScript type safety with strict mode
- VSCode extension activation on startup
- Debug configuration for F5 quick testing

### Technical Details
- Built with @modelcontextprotocol/sdk ^1.0.0
- Uses tinycolor2 for color math operations
- Integrates wcag-contrast for accessibility validation
- TypeScript 5.5+ with ES2022 target
- Lazy-loading architecture for efficient token usage

### Development
- Complete source code with extensive JSDoc comments
- Git repository with atomic commits
- Launch configuration for VSCode debugging
- Watch mode for rapid development

---

*Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
