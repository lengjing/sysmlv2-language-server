/**
 * @sysml/protocol - Configuration Types
 *
 * Project-level and workspace-level settings.
 */

export interface SysMLConfig {
    /** Validation settings */
    readonly validation: ValidationConfig;
    /** Logging settings */
    readonly logging: LoggingConfig;
    /** Standard library settings */
    readonly stdlib: StdlibConfig;
    /** Plugin settings */
    readonly plugins: PluginConfig;
}

export interface ValidationConfig {
    /** Enable/disable all validation */
    readonly enabled: boolean;
    /** Maximum number of diagnostics per file */
    readonly maxDiagnostics: number;
    /** Enable stdlib validation (usually disabled) */
    readonly validateStdlib: boolean;
    /** Disabled rule IDs */
    readonly disabledRules: readonly string[];
}

export interface LoggingConfig {
    /** Minimum log level */
    readonly level: LogLevel;
    /** Log to file path (optional) */
    readonly file?: string;
    /** Include timestamps */
    readonly timestamps: boolean;
}

export enum LogLevel {
    Error = 'error',
    Warn = 'warn',
    Info = 'info',
    Debug = 'debug',
    Trace = 'trace',
}

export interface StdlibConfig {
    /** Path to stdlib directory (auto-detected if not set) */
    readonly path?: string;
    /** Whether to preload stdlib on startup */
    readonly preload: boolean;
}

export interface PluginConfig {
    /** Plugin module paths */
    readonly modules: readonly string[];
}

export const DEFAULT_CONFIG: SysMLConfig = {
    validation: {
        enabled: true,
        maxDiagnostics: 100,
        validateStdlib: false,
        disabledRules: [],
    },
    logging: {
        level: LogLevel.Info,
        timestamps: true,
    },
    stdlib: {
        preload: true,
    },
    plugins: {
        modules: [],
    },
};
