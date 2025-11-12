import * as vscode from 'vscode';

/**
 * Represents a snapshot of theme state at a point in time
 */
interface ThemeSnapshot {
    timestamp: number;
    colors: Record<string, string>;
    description?: string;
}

/**
 * Manages theme history with undo/redo functionality
 */
export class ThemeHistoryManager {
    private history: ThemeSnapshot[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;
    private readonly config = vscode.workspace.getConfiguration('workbench');

    constructor(maxSize: number = 50) {
        this.maxHistorySize = maxSize;
        this.captureInitialState();
    }

    /**
     * Capture the initial theme state
     */
    private captureInitialState(): void {
        const currentColors = this.getCurrentColors();
        this.addSnapshot(currentColors, 'Initial state');
    }

    /**
     * Get current color customizations from VSCode config
     */
    private getCurrentColors(): Record<string, string> {
        const colorCustomizations = this.config.get<Record<string, string>>('colorCustomizations', {});
        return { ...colorCustomizations };
    }

    /**
     * Add a new snapshot to history
     */
    addSnapshot(colors: Record<string, string>, description?: string): void {
        // Remove any future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        const snapshot: ThemeSnapshot = {
            timestamp: Date.now(),
            colors: { ...colors },
            description
        };

        this.history.push(snapshot);
        this.currentIndex++;

        // Maintain max history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    /**
     * Undo to previous theme state
     */
    async undo(): Promise<boolean> {
        if (!this.canUndo()) {
            return false;
        }

        this.currentIndex--;
        const snapshot = this.history[this.currentIndex];
        await this.applySnapshot(snapshot);
        return true;
    }

    /**
     * Redo to next theme state
     */
    async redo(): Promise<boolean> {
        if (!this.canRedo()) {
            return false;
        }

        this.currentIndex++;
        const snapshot = this.history[this.currentIndex];
        await this.applySnapshot(snapshot);
        return true;
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Apply a snapshot to the current theme
     */
    private async applySnapshot(snapshot: ThemeSnapshot): Promise<void> {
        await this.config.update(
            'colorCustomizations',
            snapshot.colors,
            vscode.ConfigurationTarget.Global
        );
    }

    /**
     * Get current history info for display
     */
    getHistoryInfo(): {
        current: number;
        total: number;
        canUndo: boolean;
        canRedo: boolean;
        currentDescription?: string;
    } {
        const current = this.history[this.currentIndex];
        return {
            current: this.currentIndex + 1,
            total: this.history.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentDescription: current?.description
        };
    }

    /**
     * Get all history entries for display
     */
    getHistory(): Array<{
        index: number;
        timestamp: number;
        description?: string;
        isCurrent: boolean;
    }> {
        return this.history.map((snapshot, index) => ({
            index,
            timestamp: snapshot.timestamp,
            description: snapshot.description,
            isCurrent: index === this.currentIndex
        }));
    }

    /**
     * Jump to a specific point in history
     */
    async jumpTo(index: number): Promise<boolean> {
        if (index < 0 || index >= this.history.length) {
            return false;
        }

        this.currentIndex = index;
        const snapshot = this.history[index];
        await this.applySnapshot(snapshot);
        return true;
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.history = [];
        this.currentIndex = -1;
        this.captureInitialState();
    }

    /**
     * Export history to JSON
     */
    export(): string {
        return JSON.stringify({
            version: 1,
            history: this.history,
            currentIndex: this.currentIndex
        }, null, 2);
    }

    /**
     * Import history from JSON
     */
    import(json: string): boolean {
        try {
            const data = JSON.parse(json);
            if (data.version === 1 && Array.isArray(data.history)) {
                this.history = data.history;
                this.currentIndex = data.currentIndex ?? this.history.length - 1;
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }
}
