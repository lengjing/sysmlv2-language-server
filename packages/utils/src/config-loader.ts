/**
 * @sysml/utils - Configuration Loader
 *
 * Loads and merges configuration from multiple sources.
 */

import { DEFAULT_CONFIG, type SysMLConfig } from '@sysml/protocol';

/**
 * Deep merge two configuration objects.
 * Source properties override target properties.
 */
export function mergeConfig(
    target: Partial<SysMLConfig>,
    source: Partial<SysMLConfig>
): SysMLConfig {
    const result: Record<string, unknown> = { ...target };

    for (const key of Object.keys(source)) {
        const sourceVal = (source as Record<string, unknown>)[key];
        const targetVal = (target as Record<string, unknown>)[key];

        if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
            result[key] = mergeConfig(
                targetVal as Partial<SysMLConfig>,
                sourceVal as Partial<SysMLConfig>
            );
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal;
        }
    }

    return result as unknown as SysMLConfig;
}

/**
 * Load configuration with defaults.
 */
export function loadConfig(overrides?: Partial<SysMLConfig>): SysMLConfig {
    if (!overrides) {
        return { ...DEFAULT_CONFIG };
    }
    return mergeConfig(DEFAULT_CONFIG, overrides);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
