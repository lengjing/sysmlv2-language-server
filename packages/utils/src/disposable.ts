/**
 * @sysml/utils - Disposable Utilities
 */

import type { Disposable } from './event-emitter.js';

/**
 * A collection of disposables that can be disposed together.
 */
export class DisposableStore implements Disposable {
    private readonly disposables: Disposable[] = [];
    private disposed = false;

    /** Add a disposable to the store */
    add<T extends Disposable>(disposable: T): T {
        if (this.disposed) {
            disposable.dispose();
            return disposable;
        }
        this.disposables.push(disposable);
        return disposable;
    }

    /** Dispose all stored disposables */
    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;

        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables.length = 0;
    }

    /** Check if already disposed */
    get isDisposed(): boolean {
        return this.disposed;
    }
}

/**
 * Create a disposable from a cleanup function.
 */
export function toDisposable(fn: () => void): Disposable {
    let disposed = false;
    return {
        dispose() {
            if (!disposed) {
                disposed = true;
                fn();
            }
        },
    };
}
