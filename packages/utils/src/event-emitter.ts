/**
 * @sysml/utils - Typed Event Emitter
 *
 * Type-safe event emitter with support for async listeners.
 */

/** Event listener type */
export type EventListener<T> = (event: T) => void | Promise<void>;

/** Disposable for removing listeners */
export interface Disposable {
    dispose(): void;
}

/**
 * Type-safe event emitter.
 * 
 * @example
 * ```typescript
 * interface Events {
 *   'document:open': DocumentOpenEvent;
 *   'document:change': DocumentChangeEvent;
 * }
 * const emitter = new EventEmitter<Events>();
 * emitter.on('document:open', (event) => { ... });
 * emitter.emit('document:open', { uri: '...' });
 * ```
 */
export class EventEmitter<TEvents extends object = Record<string, unknown>> {
    private readonly listeners = new Map<keyof TEvents, Set<EventListener<any>>>();

    /**
     * Register an event listener.
     * @returns A disposable to remove the listener.
     */
    on<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): Disposable {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(listener);

        return {
            dispose: () => {
                set?.delete(listener);
                if (set?.size === 0) {
                    this.listeners.delete(event);
                }
            },
        };
    }

    /**
     * Register a one-time event listener.
     */
    once<K extends keyof TEvents>(event: K, listener: EventListener<TEvents[K]>): Disposable {
        const disposable = this.on(event, (e) => {
            disposable.dispose();
            return listener(e);
        });
        return disposable;
    }

    /**
     * Emit an event to all registered listeners.
     */
    async emit<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
        const set = this.listeners.get(event);
        if (!set) return;

        const promises: Promise<void>[] = [];
        for (const listener of set) {
            const result = listener(data);
            if (result instanceof Promise) {
                promises.push(result);
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    /**
     * Remove all listeners for an event, or all listeners if no event specified.
     */
    removeAllListeners(event?: keyof TEvents): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the number of listeners for an event.
     */
    listenerCount(event: keyof TEvents): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}
