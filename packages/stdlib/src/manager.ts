/**
 * @sysml/stdlib - Standard Library Manager
 *
 * Manages loading, caching, and querying of the standard library.
 */

import { createLogger } from '@sysml/utils';
import { STDLIB_DEPENDENCY_LAYERS, STDLIB_FILES } from './manifest.js';
import { findStdlibPath, type StdlibPathOptions } from './path-resolver.js';

const logger = createLogger('stdlib:manager');

export interface StdlibLoadResult {
    /** Number of files loaded successfully */
    loadedCount: number;
    /** Total expected files */
    totalCount: number;
    /** Whether all files loaded */
    success: boolean;
    /** Time taken in ms */
    loadTimeMs: number;
    /** Any errors encountered */
    errors: readonly string[];
    /** Any warnings */
    warnings: readonly string[];
}

/**
 * Callback for loading a single stdlib file.
 */
export interface StdlibFileLoader {
    /**
     * Load a stdlib file and return whether it was loaded successfully.
     * @param filePath Absolute path to the file
     * @param filename Base filename (e.g., 'Base.kerml')
     * @param layerIndex The dependency layer index
     */
    loadFile(filePath: string, filename: string, layerIndex: number): Promise<boolean>;
}

/**
 * Standard Library Manager.
 *
 * Responsible for finding, loading, and managing the stdlib.
 * The actual file loading is delegated to a StdlibFileLoader
 * (provided by the language server).
 */
export class StdlibManager {
    private readonly pathOptions: StdlibPathOptions;
    private stdlibPath: string | null = null;
    private loaded = false;

    constructor(pathOptions?: StdlibPathOptions) {
        this.pathOptions = pathOptions ?? {};
    }

    /**
     * Get the stdlib path (resolved lazily).
     */
    getPath(): string | null {
        if (this.stdlibPath === null) {
            this.stdlibPath = findStdlibPath(this.pathOptions);
        }
        return this.stdlibPath;
    }

    /**
     * Load the standard library using the provided loader.
     */
    async load(loader: StdlibFileLoader): Promise<StdlibLoadResult> {
        const startTime = Date.now();
        const errors: string[] = [];
        const warnings: string[] = [];
        let loadedCount = 0;

        const stdlibPath = this.getPath();
        if (!stdlibPath) {
            return {
                loadedCount: 0,
                totalCount: STDLIB_FILES.length,
                success: false,
                loadTimeMs: Date.now() - startTime,
                errors: ['Standard library directory not found'],
                warnings: [],
            };
        }

        const pathJoin = this.pathOptions.pathJoin ?? defaultPathJoin;

        logger.info(`Loading standard library from: ${stdlibPath}`);

        for (let layerIndex = 0; layerIndex < STDLIB_DEPENDENCY_LAYERS.length; layerIndex++) {
            const layer = STDLIB_DEPENDENCY_LAYERS[layerIndex];
            logger.debug(`Loading layer ${layerIndex} (${layer.length} files)`);

            for (const filename of layer) {
                const filePath = pathJoin(stdlibPath, filename);
                try {
                    const success = await loader.loadFile(filePath, filename, layerIndex);
                    if (success) {
                        loadedCount++;
                    } else {
                        warnings.push(`${filename}: loader returned false`);
                    }
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    errors.push(`${filename}: ${msg}`);
                }
            }
        }

        this.loaded = loadedCount > 0;

        const result: StdlibLoadResult = {
            loadedCount,
            totalCount: STDLIB_FILES.length,
            success: errors.length === 0 && loadedCount === STDLIB_FILES.length,
            loadTimeMs: Date.now() - startTime,
            errors,
            warnings,
        };

        logger.info(
            `Loaded ${loadedCount}/${STDLIB_FILES.length} stdlib files in ${result.loadTimeMs}ms` +
            (errors.length > 0 ? ` (${errors.length} errors)` : '')
        );

        return result;
    }

    /**
     * Check if a filename is a stdlib file.
     */
    isStdlibFile(filename: string): boolean {
        return STDLIB_FILES.includes(filename);
    }

    /**
     * Check if the stdlib has been loaded.
     */
    isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Get the dependency layer for a file.
     */
    getLayer(filename: string): number {
        for (let i = 0; i < STDLIB_DEPENDENCY_LAYERS.length; i++) {
            if (STDLIB_DEPENDENCY_LAYERS[i].includes(filename)) {
                return i;
            }
        }
        return -1;
    }
}

function defaultPathJoin(...parts: string[]): string {
    try {
        const path = require('path');
        return path.join(...parts);
    } catch {
        return parts.join('/');
    }
}
