/**
 * @sysml/language-server - Language Server
 *
 * Main server entry point. Manages the full LSP lifecycle.
 */

import { createLogger, type Logger } from '@sysml/utils';
import { loadConfig, type Disposable, DisposableStore, EventEmitter } from '@sysml/utils';
import type { SysMLConfig, DocumentUri, Diagnostic } from '@sysml/protocol';
import { SemanticModel } from '@sysml/semantics';
import { IncrementalParser } from '@sysml/parser';
import { StdlibManager } from '@sysml/stdlib';
import { DocumentManager } from './document-manager.js';
import { DiagnosticService } from './diagnostics.js';

export interface ServerOptions {
    config?: Partial<SysMLConfig>;
}

interface ServerEvents {
    'diagnostics': { uri: DocumentUri; diagnostics: Diagnostic[] };
    'ready': undefined;
    'error': { message: string; error?: unknown };
}

/**
 * SysML v2 Language Server.
 *
 * This is the core server that processes documents through the pipeline:
 * Text → Parser → AST → Semantic Model → Validation → Diagnostics
 */
export class SysMLLanguageServer {
    readonly logger: Logger;
    readonly config: SysMLConfig;
    readonly parser: IncrementalParser;
    readonly semanticModel: SemanticModel;
    readonly documentManager: DocumentManager;
    readonly diagnosticService: DiagnosticService;
    readonly stdlibManager: StdlibManager;
    readonly events: EventEmitter<ServerEvents>;
    
    private readonly disposables = new DisposableStore();
    private initialized = false;

    constructor(options?: ServerOptions) {
        this.config = loadConfig(options?.config);
        this.logger = createLogger('sysml-server', this.config.logging.level);
        this.parser = new IncrementalParser();
        this.semanticModel = new SemanticModel();
        this.stdlibManager = new StdlibManager({
            explicitPath: this.config.stdlib.path,
        });
        this.events = new EventEmitter<ServerEvents>();
        
        this.documentManager = new DocumentManager(this.parser, this.semanticModel, this.logger);
        this.diagnosticService = new DiagnosticService(
            this.semanticModel,
            this.config.validation,
            this.logger
        );

        // Wire up diagnostics emission
        this.disposables.add(
            this.documentManager.events.on('documentProcessed', (event) => {
                if (this.config.validation.enabled) {
                    const diagnostics = this.diagnosticService.computeDiagnostics(
                        event.uri,
                        event.isStdlib
                    );
                    this.events.emit('diagnostics', { uri: event.uri, diagnostics });
                }
            })
        );
    }

    /**
     * Initialize the server.
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        this.logger.info('Initializing SysML Language Server...');

        // Load stdlib if configured
        if (this.config.stdlib.preload) {
            await this.loadStdlib();
        }

        this.initialized = true;
        this.logger.info('SysML Language Server initialized.');
        await this.events.emit('ready', undefined);
    }

    /**
     * Open a document.
     */
    openDocument(uri: DocumentUri, text: string, version: number, languageId?: string): void {
        this.documentManager.openDocument(uri, text, version, languageId);
    }

    /**
     * Update a document.
     */
    updateDocument(uri: DocumentUri, text: string, version: number): void {
        this.documentManager.updateDocument(uri, text, version);
    }

    /**
     * Close a document.
     */
    closeDocument(uri: DocumentUri): void {
        this.documentManager.closeDocument(uri);
    }

    /**
     * Shutdown the server.
     */
    async shutdown(): Promise<void> {
        this.logger.info('Shutting down SysML Language Server...');
        this.disposables.dispose();
        this.parser.dispose();
        this.semanticModel.clear();
        this.initialized = false;
    }

    /**
     * Load the standard library.
     */
    private async loadStdlib(): Promise<void> {
        this.logger.info('Loading standard library...');
        const result = await this.stdlibManager.load({
            loadFile: async (filePath, filename) => {
                try {
                    const fs = require('fs');
                    const text = fs.readFileSync(filePath, 'utf-8');
                    const uri = `file://${filePath}`;
                    this.documentManager.openDocument(uri, text, 0, undefined, true);
                    return true;
                } catch {
                    return false;
                }
            },
        });

        if (result.success) {
            this.logger.info(`Standard library loaded: ${result.loadedCount} files in ${result.loadTimeMs}ms`);
        } else {
            this.logger.warn(
                `Standard library loaded with issues: ${result.loadedCount}/${result.totalCount} files`
            );
        }
    }
}
