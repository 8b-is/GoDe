import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Workspace Controller - God Mode workspace manipulation
 */
export class WorkspaceController {
    /**
     * List all files in workspace with optional glob pattern
     */
    async listFiles(pattern?: string, maxDepth: number = 5): Promise<string[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const files = await vscode.workspace.findFiles(
            pattern || '**/*',
            '**/node_modules/**',
            1000
        );

        return files.map(uri => vscode.workspace.asRelativePath(uri));
    }

    /**
     * Get workspace structure as a tree
     */
    async getWorkspaceTree(maxDepth: number = 3): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const buildTree = async (dir: string, depth: number = 0): Promise<any> => {
            if (depth > maxDepth) {
                return null;
            }

            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                const tree: any = {
                    name: path.basename(dir),
                    type: 'directory',
                    children: []
                };

                for (const entry of entries) {
                    // Skip node_modules and .git
                    if (entry.name === 'node_modules' || entry.name === '.git') {
                        continue;
                    }

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        const subtree = await buildTree(fullPath, depth + 1);
                        if (subtree) {
                            tree.children.push(subtree);
                        }
                    } else {
                        tree.children.push({
                            name: entry.name,
                            type: 'file'
                        });
                    }
                }

                return tree;
            } catch {
                return null;
            }
        };

        return await buildTree(workspaceFolders[0].uri.fsPath);
    }

    /**
     * Create a new file with content
     */
    async createFile(relativePath: string, content: string = ''): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const fullPath = path.join(workspaceFolders[0].uri.fsPath, relativePath);
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
    }

    /**
     * Delete a file or folder
     */
    async delete(relativePath: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const fullPath = path.join(workspaceFolders[0].uri.fsPath, relativePath);
        const uri = vscode.Uri.file(fullPath);

        await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
    }

    /**
     * Rename/move a file or folder
     */
    async rename(oldPath: string, newPath: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder open');
        }

        const oldUri = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, oldPath));
        const newUri = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, newPath));

        await vscode.workspace.fs.rename(oldUri, newUri);
    }

    /**
     * Get all tasks defined in workspace
     */
    async listTasks(): Promise<Array<{
        name: string;
        source: string;
        detail?: string;
    }>> {
        const tasks = await vscode.tasks.fetchTasks();

        return tasks.map(task => ({
            name: task.name,
            source: task.source,
            detail: task.detail
        }));
    }

    /**
     * Execute a task by name
     */
    async runTask(taskName: string): Promise<void> {
        const tasks = await vscode.tasks.fetchTasks();
        const task = tasks.find(t => t.name === taskName);

        if (!task) {
            throw new Error(`Task '${taskName}' not found`);
        }

        await vscode.tasks.executeTask(task);
    }

    /**
     * Get workspace settings
     */
    async getSettings(section?: string): Promise<any> {
        const config = vscode.workspace.getConfiguration(section);
        return config;
    }

    /**
     * Update workspace setting
     */
    async updateSetting(
        section: string,
        key: string,
        value: any,
        target: 'workspace' | 'user' = 'workspace'
    ): Promise<void> {
        const config = vscode.workspace.getConfiguration(section);
        const configTarget = target === 'workspace'
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;

        await config.update(key, value, configTarget);
    }

    /**
     * Search for text in workspace
     */
    async searchText(
        query: string,
        options?: {
            includePattern?: string;
            excludePattern?: string;
            maxResults?: number;
        }
    ): Promise<Array<{
        file: string;
        line: number;
        column: number;
        text: string;
    }>> {
        const results: Array<{
            file: string;
            line: number;
            column: number;
            text: string;
        }> = [];

        const files = await vscode.workspace.findFiles(
            options?.includePattern || '**/*',
            options?.excludePattern || '**/node_modules/**',
            options?.maxResults || 100
        );

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const lines = text.split('\n');

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const index = line.indexOf(query);

                    if (index !== -1) {
                        results.push({
                            file: vscode.workspace.asRelativePath(file),
                            line: i + 1,
                            column: index + 1,
                            text: line.trim()
                        });
                    }
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return results;
    }

    /**
     * Get workspace info
     */
    getWorkspaceInfo(): {
        name?: string;
        folders: Array<{ name: string; path: string }>;
        workspaceFile?: string;
    } {
        const workspaceFolders = vscode.workspace.workspaceFolders || [];

        return {
            name: vscode.workspace.name,
            folders: workspaceFolders.map(folder => ({
                name: folder.name,
                path: folder.uri.fsPath
            })),
            workspaceFile: vscode.workspace.workspaceFile?.fsPath
        };
    }
}
