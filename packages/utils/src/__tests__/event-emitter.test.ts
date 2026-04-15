import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../event-emitter.js';

interface TestEvents {
    'test': { value: number };
    'other': string;
}

describe('EventEmitter', () => {
    it('should emit events to listeners', async () => {
        const emitter = new EventEmitter<TestEvents>();
        const listener = vi.fn();

        emitter.on('test', listener);
        await emitter.emit('test', { value: 42 });

        expect(listener).toHaveBeenCalledWith({ value: 42 });
    });

    it('should support multiple listeners', async () => {
        const emitter = new EventEmitter<TestEvents>();
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        emitter.on('test', listener1);
        emitter.on('test', listener2);
        await emitter.emit('test', { value: 1 });

        expect(listener1).toHaveBeenCalledOnce();
        expect(listener2).toHaveBeenCalledOnce();
    });

    it('should dispose listeners', async () => {
        const emitter = new EventEmitter<TestEvents>();
        const listener = vi.fn();

        const disposable = emitter.on('test', listener);
        disposable.dispose();
        await emitter.emit('test', { value: 1 });

        expect(listener).not.toHaveBeenCalled();
    });

    it('should support once listeners', async () => {
        const emitter = new EventEmitter<TestEvents>();
        const listener = vi.fn();

        emitter.once('test', listener);
        await emitter.emit('test', { value: 1 });
        await emitter.emit('test', { value: 2 });

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith({ value: 1 });
    });

    it('should report listener count', () => {
        const emitter = new EventEmitter<TestEvents>();
        expect(emitter.listenerCount('test')).toBe(0);

        const d1 = emitter.on('test', () => {});
        const d2 = emitter.on('test', () => {});
        expect(emitter.listenerCount('test')).toBe(2);

        d1.dispose();
        expect(emitter.listenerCount('test')).toBe(1);

        d2.dispose();
        expect(emitter.listenerCount('test')).toBe(0);
    });
});
