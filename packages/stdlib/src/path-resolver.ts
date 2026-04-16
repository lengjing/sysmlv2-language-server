/**
 * @sysml/stdlib - Standard Library Path Resolver
 *
 * Finds the stdlib directory from various deployment contexts.
 */

import { createLogger } from '@sysml/utils';

const logger = createLogger('stdlib:path-resolver');

export interface StdlibPathOptions {
    /** Explicit path override */
    explicitPath?: string;
    /** Base directories to search from */
    baseDirs?: string[];
    /** File system check function (for testability) */
    fileExists?: (path: string) => boolean;
    /** Path join function */
    pathJoin?: (...parts: string[]) => string;
    /** Path resolve function */
    pathResolve?: (...parts: string[]) => string;
}

/**
 * Find the stdlib directory.
 *
 * Search order:
 * 1. Explicit path from options
 * 2. SYSML_STDLIB_PATH environment variable
 * 3. Auto-detection from base directories
 *
 * @returns The path to the stdlib directory, or null if not found.
 */
export function findStdlibPath(options?: StdlibPathOptions): string | null {
    const fileExists = options?.fileExists ?? defaultFileExists;
    const pathJoin = options?.pathJoin ?? defaultPathJoin;
    const pathResolve = options?.pathResolve ?? defaultPathResolve;

    // 1. Explicit path
    if (options?.explicitPath) {
        const marker = pathJoin(options.explicitPath, 'Base.kerml');
        if (fileExists(marker)) {
            logger.info(`Using explicit stdlib path: ${options.explicitPath}`);
            return options.explicitPath;
        }
        logger.warn(`Explicit stdlib path '${options.explicitPath}' does not contain Base.kerml`);
    }

    // 2. Environment variable
    const envPath = typeof process !== 'undefined' ? process.env.SYSML_STDLIB_PATH : undefined;
    if (envPath) {
        const marker = pathJoin(envPath, 'Base.kerml');
        if (fileExists(marker)) {
            logger.info(`Using stdlib from SYSML_STDLIB_PATH: ${envPath}`);
            return envPath;
        }
        logger.warn(`SYSML_STDLIB_PATH='${envPath}' does not contain Base.kerml`);
    }

    // 3. Auto-detection
    const baseDirs = options?.baseDirs ?? getDefaultBaseDirs();
    const searchPaths: string[] = [];

    for (const baseDir of baseDirs) {
        searchPaths.push(pathResolve(baseDir, 'stdlib'));
        searchPaths.push(pathResolve(baseDir, '..', 'stdlib'));
        searchPaths.push(pathResolve(baseDir, '..', '..', 'stdlib'));
        searchPaths.push(pathResolve(baseDir, 'src', 'packages', 'language-server', 'stdlib'));
    }

    // Deduplicate
    const unique = [...new Set(searchPaths)];

    for (const candidate of unique) {
        const marker = pathJoin(candidate, 'Base.kerml');
        if (fileExists(marker)) {
            logger.info(`Found stdlib at: ${candidate}`);
            return candidate;
        }
    }

    logger.warn(`stdlib not found. Searched ${unique.length} locations.`);
    return null;
}

function getDefaultBaseDirs(): string[] {
    const dirs: string[] = [];
    if (typeof process !== 'undefined') {
        if (process.argv[1]) {
            dirs.push(defaultDirname(process.argv[1]));
        }
        dirs.push(process.cwd());
    }
    return dirs;
}

function defaultFileExists(filePath: string): boolean {
    try {
        const fs = require('fs');
        return fs.existsSync(filePath);
    } catch {
        return false;
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

function defaultPathResolve(...parts: string[]): string {
    try {
        const path = require('path');
        return path.resolve(...parts);
    } catch {
        return parts.join('/');
    }
}

function defaultDirname(filePath: string): string {
    try {
        const path = require('path');
        return path.dirname(filePath);
    } catch {
        const lastSlash = filePath.lastIndexOf('/');
        return lastSlash >= 0 ? filePath.substring(0, lastSlash) : '.';
    }
}
