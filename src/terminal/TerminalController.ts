import * as vscode from 'vscode';

interface TerminalInfo {
    id: number;
    name: string;
    processId?: number;
}

/**
 * Terminal Controller - God Mode terminal manipulation
 */
export class TerminalController {
    private terminals: Map<number, vscode.Terminal> = new Map();
    private nextId: number = 1;

    constructor() {
        // Track existing terminals
        vscode.window.terminals.forEach(terminal => {
            this.terminals.set(this.nextId++, terminal);
        });

        // Listen for terminal changes
        vscode.window.onDidOpenTerminal(terminal => {
            this.terminals.set(this.nextId++, terminal);
        });

        vscode.window.onDidCloseTerminal(terminal => {
            const entry = Array.from(this.terminals.entries())
                .find(([_, t]) => t === terminal);
            if (entry) {
                this.terminals.delete(entry[0]);
            }
        });
    }

    /**
     * List all terminals
     */
    async listTerminals(): Promise<TerminalInfo[]> {
        const terminals: TerminalInfo[] = [];

        for (const [id, terminal] of this.terminals) {
            terminals.push({
                id,
                name: terminal.name,
                processId: await terminal.processId
            });
        }

        return terminals;
    }

    /**
     * Create a new terminal
     */
    createTerminal(options?: {
        name?: string;
        cwd?: string;
        env?: Record<string, string>;
        shellPath?: string;
    }): number {
        const terminal = vscode.window.createTerminal({
            name: options?.name || `Terminal ${this.nextId}`,
            cwd: options?.cwd,
            env: options?.env,
            shellPath: options?.shellPath
        });

        const id = this.nextId++;
        this.terminals.set(id, terminal);

        return id;
    }

    /**
     * Send text to terminal
     */
    sendText(terminalId: number, text: string, addNewLine: boolean = true): void {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            throw new Error(`Terminal ${terminalId} not found`);
        }

        terminal.sendText(text, addNewLine);
    }

    /**
     * Show terminal
     */
    show(terminalId: number, preserveFocus: boolean = false): void {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            throw new Error(`Terminal ${terminalId} not found`);
        }

        terminal.show(preserveFocus);
    }

    /**
     * Hide terminal (focus editor)
     */
    hide(): void {
        vscode.commands.executeCommand('workbench.action.terminal.hide');
    }

    /**
     * Dispose/close terminal
     */
    dispose(terminalId: number): void {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            throw new Error(`Terminal ${terminalId} not found`);
        }

        terminal.dispose();
        this.terminals.delete(terminalId);
    }

    /**
     * Dispose all terminals
     */
    disposeAll(): void {
        for (const [id, terminal] of this.terminals) {
            terminal.dispose();
        }
        this.terminals.clear();
    }

    /**
     * Get active terminal
     */
    getActiveTerminal(): TerminalInfo | null {
        const activeTerminal = vscode.window.activeTerminal;
        if (!activeTerminal) {
            return null;
        }

        const entry = Array.from(this.terminals.entries())
            .find(([_, t]) => t === activeTerminal);

        if (!entry) {
            return null;
        }

        return {
            id: entry[0],
            name: activeTerminal.name
        };
    }

    /**
     * Execute command in terminal
     */
    async execute(
        command: string,
        options?: {
            terminalId?: number;
            createNew?: boolean;
            name?: string;
            cwd?: string;
        }
    ): Promise<number> {
        let terminalId = options?.terminalId;

        if (!terminalId || options?.createNew) {
            terminalId = this.createTerminal({
                name: options?.name,
                cwd: options?.cwd
            });
        }

        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            throw new Error(`Terminal ${terminalId} not found`);
        }

        terminal.show();
        terminal.sendText(command);

        return terminalId;
    }

    /**
     * Clear terminal
     */
    clear(terminalId?: number): void {
        if (terminalId) {
            const terminal = this.terminals.get(terminalId);
            if (!terminal) {
                throw new Error(`Terminal ${terminalId} not found`);
            }
            terminal.sendText('clear');
        } else {
            vscode.commands.executeCommand('workbench.action.terminal.clear');
        }
    }

    /**
     * Split terminal
     */
    async split(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.terminal.split');
    }

    /**
     * Navigate between terminals
     */
    async navigate(direction: 'next' | 'previous'): Promise<void> {
        const command = direction === 'next'
            ? 'workbench.action.terminal.focusNext'
            : 'workbench.action.terminal.focusPrevious';

        await vscode.commands.executeCommand(command);
    }

    /**
     * Rename terminal
     */
    async rename(terminalId: number, newName: string): Promise<void> {
        const terminal = this.terminals.get(terminalId);
        if (!terminal) {
            throw new Error(`Terminal ${terminalId} not found`);
        }

        await vscode.commands.executeCommand('workbench.action.terminal.rename', {
            name: newName
        });
    }

    /**
     * Toggle terminal
     */
    async toggle(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
    }

    /**
     * Maximize/restore terminal
     */
    async toggleMaximize(): Promise<void> {
        await vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
    }

    /**
     * Change terminal size
     */
    async resize(rows?: number, cols?: number): Promise<void> {
        const terminal = vscode.window.activeTerminal;
        if (!terminal) {
            throw new Error('No active terminal');
        }

        // Note: VSCode doesn't expose terminal resizing directly,
        // but we can change font size which affects it
        if (rows || cols) {
            // This is a workaround - change terminal font size
            const config = vscode.workspace.getConfiguration('terminal.integrated');
            const currentSize = config.get<number>('fontSize', 12);

            // Estimate size change
            const newSize = currentSize + (rows ? (rows > 30 ? -1 : 1) : 0);
            await config.update('fontSize', newSize, vscode.ConfigurationTarget.Global);
        }
    }

    /**
     * Run task in terminal
     */
    async runTask(taskName: string): Promise<void> {
        const tasks = await vscode.tasks.fetchTasks();
        const task = tasks.find(t => t.name === taskName);

        if (!task) {
            throw new Error(`Task '${taskName}' not found`);
        }

        await vscode.tasks.executeTask(task);
    }
}
