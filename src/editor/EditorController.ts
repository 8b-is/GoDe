import * as vscode from 'vscode';

/**
 * Editor Controller - God Mode editor manipulation
 */
export class EditorController {
    /**
     * Get all open editors/tabs
     */
    getOpenEditors(): Array<{
        fileName: string;
        viewColumn?: number;
        isDirty: boolean;
        languageId: string;
    }> {
        return vscode.window.tabGroups.all.flatMap(group =>
            group.tabs.map(tab => {
                const input = tab.input as any;
                return {
                    fileName: input?.uri?.fsPath || 'Untitled',
                    viewColumn: group.viewColumn,
                    isDirty: tab.isDirty,
                    languageId: input?.uri ? vscode.workspace.textDocuments.find(
                        doc => doc.uri.fsPath === input.uri.fsPath
                    )?.languageId || 'unknown' : 'unknown'
                };
            })
        );
    }

    /**
     * Open a file in editor
     */
    async openFile(
        relativePath: string,
        options?: {
            viewColumn?: number;
            preview?: boolean;
            selection?: { start: number; end: number };
        }
    ): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const uri = vscode.Uri.file(
            require('path').join(workspaceFolders[0].uri.fsPath, relativePath)
        );

        const document = await vscode.workspace.openTextDocument(uri);
        const viewColumn = options?.viewColumn || vscode.ViewColumn.One;
        const preview = options?.preview !== false;

        const editor = await vscode.window.showTextDocument(document, {
            viewColumn,
            preview
        });

        // Set selection if provided
        if (options?.selection) {
            const start = document.positionAt(options.selection.start);
            const end = document.positionAt(options.selection.end);
            editor.selection = new vscode.Selection(start, end);
            editor.revealRange(new vscode.Range(start, end));
        }
    }

    /**
     * Close editor/tab
     */
    async closeEditor(fileName?: string): Promise<void> {
        if (!fileName) {
            // Close active editor
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            return;
        }

        // Find and close specific editor
        const groups = vscode.window.tabGroups.all;
        for (const group of groups) {
            for (const tab of group.tabs) {
                const input = tab.input as any;
                if (input?.uri?.fsPath?.includes(fileName)) {
                    await vscode.window.tabGroups.close(tab);
                    return;
                }
            }
        }
    }

    /**
     * Close all editors
     */
    async closeAllEditors(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    }

    /**
     * Split editor
     */
    async splitEditor(direction: 'horizontal' | 'vertical' = 'vertical'): Promise<void> {
        const command = direction === 'horizontal'
            ? 'workbench.action.splitEditorDown'
            : 'workbench.action.splitEditorRight';

        await vscode.commands.executeCommand(command);
    }

    /**
     * Navigate between editors
     */
    async navigateEditor(direction: 'next' | 'previous' | 'first' | 'last'): Promise<void> {
        const commands = {
            next: 'workbench.action.nextEditor',
            previous: 'workbench.action.previousEditor',
            first: 'workbench.action.firstEditorInGroup',
            last: 'workbench.action.lastEditorInGroup'
        };

        await vscode.commands.executeCommand(commands[direction]);
    }

    /**
     * Move editor to different group
     */
    async moveEditor(
        targetGroup: 'left' | 'right' | 'up' | 'down' | 'first' | 'last'
    ): Promise<void> {
        const commands = {
            left: 'workbench.action.moveEditorToLeftGroup',
            right: 'workbench.action.moveEditorToRightGroup',
            up: 'workbench.action.moveEditorToAboveGroup',
            down: 'workbench.action.moveEditorToBelowGroup',
            first: 'workbench.action.moveEditorToFirstGroup',
            last: 'workbench.action.moveEditorToLastGroup'
        };

        await vscode.commands.executeCommand(commands[targetGroup]);
    }

    /**
     * Get active editor info
     */
    getActiveEditor(): {
        fileName?: string;
        languageId?: string;
        lineCount?: number;
        selection?: { start: number; end: number; text: string };
        cursorPosition?: { line: number; character: number };
    } | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const selection = editor.selection;

        return {
            fileName: editor.document.fileName,
            languageId: editor.document.languageId,
            lineCount: editor.document.lineCount,
            selection: {
                start: editor.document.offsetAt(selection.start),
                end: editor.document.offsetAt(selection.end),
                text: editor.document.getText(selection)
            },
            cursorPosition: {
                line: selection.active.line + 1,
                character: selection.active.character + 1
            }
        };
    }

    /**
     * Insert text at cursor position
     */
    async insertText(text: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, text);
        });
    }

    /**
     * Replace selected text
     */
    async replaceSelection(text: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, text);
        });
    }

    /**
     * Go to line
     */
    async goToLine(line: number): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active editor');
        }

        const position = new vscode.Position(line - 1, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
    }

    /**
     * Format document
     */
    async formatDocument(): Promise<void> {
        await vscode.commands.executeCommand('editor.action.formatDocument');
    }

    /**
     * Toggle line comment
     */
    async toggleComment(): Promise<void> {
        await vscode.commands.executeCommand('editor.action.commentLine');
    }

    /**
     * Toggle word wrap
     */
    async toggleWordWrap(): Promise<void> {
        await vscode.commands.executeCommand('editor.action.toggleWordWrap');
    }

    /**
     * Toggle minimap
     */
    async toggleMinimap(): Promise<void> {
        const config = vscode.workspace.getConfiguration('editor');
        const current = config.get<boolean>('minimap.enabled', true);
        await config.update('minimap.enabled', !current, vscode.ConfigurationTarget.Global);
    }

    /**
     * Change editor font size
     */
    async setFontSize(size: number): Promise<void> {
        if (size < 6 || size > 100) {
            throw new Error('Font size must be between 6 and 100');
        }

        const config = vscode.workspace.getConfiguration('editor');
        await config.update('fontSize', size, vscode.ConfigurationTarget.Global);
    }

    /**
     * Zoom in/out
     */
    async zoom(direction: 'in' | 'out' | 'reset'): Promise<void> {
        const commands = {
            in: 'workbench.action.zoomIn',
            out: 'workbench.action.zoomOut',
            reset: 'workbench.action.zoomReset'
        };

        await vscode.commands.executeCommand(commands[direction]);
    }

    /**
     * Toggle full screen
     */
    async toggleFullScreen(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.toggleFullScreen');
    }

    /**
     * Toggle zen mode
     */
    async toggleZenMode(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.toggleZenMode');
    }

    /**
     * Set editor layout
     */
    async setLayout(layout: {
        orientation: 'horizontal' | 'vertical';
        groups: number[];
    }): Promise<void> {
        const orientation = layout.orientation === 'horizontal' ? 1 : 0;
        await vscode.commands.executeCommand('vscode.setEditorLayout', {
            orientation,
            groups: layout.groups.map(size => ({ size }))
        });
    }
}
