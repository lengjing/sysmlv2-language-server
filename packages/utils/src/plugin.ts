/**
 * @sysml/utils - Plugin System
 *
 * Extensible plugin system for validation rules, custom providers, etc.
 */

/** Plugin metadata */
export interface PluginMeta {
    readonly name: string;
    readonly version: string;
    readonly description?: string;
}

/** Plugin lifecycle hooks */
export interface Plugin {
    readonly meta: PluginMeta;
    
    /** Called when the plugin is loaded */
    onLoad?(context: PluginContext): void | Promise<void>;
    
    /** Called when the plugin is unloaded */
    onUnload?(): void | Promise<void>;
}

/** Context provided to plugins */
export interface PluginContext {
    /** Register an extension point */
    register<T>(extensionPoint: string, extension: T): void;
    
    /** Get the logger for this plugin */
    readonly logger: import('./logger.js').Logger;
}

/** Extension point registry */
export class ExtensionRegistry {
    private readonly extensions = new Map<string, unknown[]>();

    /** Register an extension */
    register<T>(extensionPoint: string, extension: T): void {
        let list = this.extensions.get(extensionPoint);
        if (!list) {
            list = [];
            this.extensions.set(extensionPoint, list);
        }
        list.push(extension);
    }

    /** Get all extensions for a point */
    get<T>(extensionPoint: string): readonly T[] {
        return (this.extensions.get(extensionPoint) as T[]) ?? [];
    }

    /** Check if an extension point has any extensions */
    has(extensionPoint: string): boolean {
        const list = this.extensions.get(extensionPoint);
        return list !== undefined && list.length > 0;
    }

    /** Clear all extensions for a point */
    clear(extensionPoint?: string): void {
        if (extensionPoint) {
            this.extensions.delete(extensionPoint);
        } else {
            this.extensions.clear();
        }
    }
}

/**
 * Plugin manager that loads and manages plugins.
 */
export class PluginManager {
    private readonly plugins = new Map<string, Plugin>();
    private readonly registry = new ExtensionRegistry();
    private readonly loggerFactory: (name: string) => import('./logger.js').Logger;

    constructor(loggerFactory: (name: string) => import('./logger.js').Logger) {
        this.loggerFactory = loggerFactory;
    }

    /** Load a plugin */
    async load(plugin: Plugin): Promise<void> {
        if (this.plugins.has(plugin.meta.name)) {
            throw new Error(`Plugin '${plugin.meta.name}' is already loaded.`);
        }

        const context: PluginContext = {
            register: <T>(point: string, ext: T) => this.registry.register(point, ext),
            logger: this.loggerFactory(`plugin:${plugin.meta.name}`),
        };

        if (plugin.onLoad) {
            await plugin.onLoad(context);
        }

        this.plugins.set(plugin.meta.name, plugin);
    }

    /** Unload a plugin */
    async unload(name: string): Promise<void> {
        const plugin = this.plugins.get(name);
        if (!plugin) return;

        if (plugin.onUnload) {
            await plugin.onUnload();
        }

        this.plugins.delete(name);
    }

    /** Get the extension registry */
    getRegistry(): ExtensionRegistry {
        return this.registry;
    }

    /** Get all loaded plugin names */
    getLoadedPlugins(): string[] {
        return [...this.plugins.keys()];
    }
}
