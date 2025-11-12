# GoDE Testing Guide

This guide walks you through testing the complete workflow of the GoDE extension.

## Prerequisites

- VSCode installed
- GoDE extension compiled (`npm run compile` completed successfully)
- GoDE extensions installed (for theme switching tests)

## Step 1: Launch Extension Development Host

1. Open the `gode` project in VSCode
2. Press **F5** to launch the Extension Development Host
3. A new VSCode window will open with the extension loaded

**Expected Result:**
- New VSCode window opens
- Extension is activated on startup

## Step 2: Verify Server Started

1. In the original VSCode window (not the Extension Development Host)
2. Open the Debug Console (View > Debug Console)
3. Look for these messages:
   - `GoDE extension is now active`
   - `GoDE server started successfully`

**Expected Result:**
```
GoDE extension is now active
GoDE server started successfully
```

If you see errors, check the Debug Console for details.

## Step 3: Test Status Command

In the Extension Development Host window:

1. Open Command Palette: **Cmd+Shift+P** (Mac) or **Ctrl+Shift+P** (Windows/Linux)
2. Type: `GoDE: Show Status`
3. Select the command

**Expected Result:**
- Info message appears: "GoDE is running!"

## Step 4: Test MCP Tools (Manual)

Since MCP tools are designed to be called by AI assistants, we can't easily test them directly from VSCode UI. However, you can verify the extension is working by:

1. Opening VSCode settings.json (Cmd+, then click the {} icon)
2. Look for or add `"workbench.colorCustomizations"` section

**Manual Color Test:**
Add this to your settings.json:
```json
"workbench.colorCustomizations": {
  "editor.background": "#001100"
}
```

3. Save the file
4. Your editor background should immediately change to dark green

**To reset:**
Remove the `workbench.colorCustomizations` section or set it to `{}`

## Step 5: Test Automatic MCP Registration (NEW! 🎉)

The extension now automatically registers itself with GitHub Copilot and other AI assistants!

**What happens automatically:**
1. Extension activates on startup
2. MCP server is registered via VSCode API
3. GitHub Copilot/Claude/other AI tools discover it automatically
4. You see a welcome notification (first time only)

**To verify auto-registration:**
1. Open GitHub Copilot Chat (or your AI assistant)
2. Check available MCP servers - you should see "GoDe"
3. No manual configuration needed! 🚀

**Expected Results:**
- Welcome notification appears on first install
- MCP server appears in AI assistant's available tools
- Zero manual configuration required!

## Step 6: Test with AI Assistant

Now that the MCP server is auto-registered, try these natural language requests:

**With GitHub Copilot Chat:**
- "List all available color groups"
- "Show me the colors in the editor group"
- "Set the editor background to #000000"
- "What is the current value of editor.foreground?"
- "Reset all color customizations"

**With Claude Desktop** (requires MCP config):
- Same commands as above
- Claude can also suggest color schemes!

**Expected Results:**
- AI can list color groups (7 groups)
- AI can retrieve colors from specific groups
- AI can set colors and see the changes immediately
- AI can query current values
- AI can reset customizations

## Step 7: Test with Different Themes

1. Switch to "8b Cyberpunk" theme (if installed):
   - Cmd+K Cmd+T → Select "8b Cyberpunk"
2. Manually add color customizations to settings.json
3. Switch to "8b CRT Terminal" theme
4. Verify your customizations persist across themes

**Expected Result:**
- Color customizations apply on top of any theme
- Switching themes preserves your customizations

## Step 8: Verify Build Output

Check that all files compiled correctly:

```bash
cd /Users/wraith/Documents/GitHub/ext/gode
ls -la out/
```

**Expected Structure:**
```
out/
├── colors/
│   ├── groups.js
│   └── manipulation.js
├── extension.js
├── mcp/
│   ├── server.js
│   └── types.js
└── vscode/
    └── config.js
```

## Common Issues

### Extension Doesn't Activate
- Check Debug Console for error messages
- Verify `npm run compile` succeeded
- Check that package.json has correct activation events

### MCP Server Fails to Start
- Check for port conflicts
- Verify MCP SDK is installed: `npm list @modelcontextprotocol/sdk`
- Look for TypeScript compilation errors

### Colors Don't Change
- Verify settings.json is properly formatted
- Check that color keys are valid (see data/color-groups.json)
- Ensure you're using hex color format: "#rrggbb"

## Success Criteria

✅ Extension activates on startup
✅ MCP server starts without errors
✅ Status command shows success message
✅ Manual color changes work via settings.json
✅ All files compiled to `out/` directory
✅ No TypeScript errors or warnings

## Next Steps

Once basic testing passes:

1. Test with real AI assistant (Claude, etc.)
2. Try all 5 MCP tools
3. Test error handling (invalid colors, unknown groups)
4. Test accessibility warnings (low contrast colors)
5. Performance testing (multiple rapid color changes)

## Reporting Issues

If you find issues:

1. Note the exact steps to reproduce
2. Include Debug Console output
3. Check TypeScript compilation messages
4. Document expected vs actual behavior

---

Happy testing! 🎨

*Remember: Trisha from Accounting says good testing prevents late-night debugging! 😄*
