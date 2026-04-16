/**
 * @sysml/utils - Logger
 *
 * Structured logging with configurable levels and outputs.
 */

import { LogLevel } from '@sysml/protocol';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.Error]: 0,
    [LogLevel.Warn]: 1,
    [LogLevel.Info]: 2,
    [LogLevel.Debug]: 3,
    [LogLevel.Trace]: 4,
};

export interface LogOutput {
    write(level: LogLevel, component: string, message: string, data?: unknown): void;
}

export class ConsoleLogOutput implements LogOutput {
    write(level: LogLevel, component: string, message: string, data?: unknown): void {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;
        
        switch (level) {
            case LogLevel.Error:
                console.error(`${prefix} ${message}`, data ?? '');
                break;
            case LogLevel.Warn:
                console.warn(`${prefix} ${message}`, data ?? '');
                break;
            case LogLevel.Debug:
            case LogLevel.Trace:
                console.debug(`${prefix} ${message}`, data ?? '');
                break;
            default:
                console.log(`${prefix} ${message}`, data ?? '');
        }
    }
}

/**
 * Logger instance for a specific component.
 */
export class Logger {
    private readonly component: string;
    private level: LogLevel;
    private output: LogOutput;

    constructor(component: string, level: LogLevel = LogLevel.Info, output?: LogOutput) {
        this.component = component;
        this.level = level;
        this.output = output ?? new ConsoleLogOutput();
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    setOutput(output: LogOutput): void {
        this.output = output;
    }

    error(message: string, data?: unknown): void {
        this.log(LogLevel.Error, message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log(LogLevel.Warn, message, data);
    }

    info(message: string, data?: unknown): void {
        this.log(LogLevel.Info, message, data);
    }

    debug(message: string, data?: unknown): void {
        this.log(LogLevel.Debug, message, data);
    }

    trace(message: string, data?: unknown): void {
        this.log(LogLevel.Trace, message, data);
    }

    /** Create a child logger with a sub-component name */
    child(subComponent: string): Logger {
        return new Logger(`${this.component}:${subComponent}`, this.level, this.output);
    }

    private log(level: LogLevel, message: string, data?: unknown): void {
        if (LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.level]) {
            this.output.write(level, this.component, message, data);
        }
    }
}

/** Create a logger for a component */
export function createLogger(component: string, level?: LogLevel): Logger {
    return new Logger(component, level);
}
