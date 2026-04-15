/**
 * @sysml/language-server - Document Manager
 *
 * Manages open documents and coordinates the processing pipeline.
 */

import type { DocumentUri } from '@sysml/protocol';
import type { DocumentAst } from '@sysml/ast';
import type { IncrementalParser } from '@sysml/parser';
import type { SemanticModel } from '@sysml/semantics';
import { EventEmitter, type Logger } from '@sysml/utils';

interface DocumentEntry {
    uri: DocumentUri;
    text: string;
    version: number;
    languageId: string;
    ast?: DocumentAst;
    isStdlib: boolean;
}

interface DocumentManagerEvents {
    'documentProcessed': { uri: DocumentUri; version: number; isStdlib: boolean };
    'documentClosed': { uri: DocumentUri };
}

/**
 * Manages open documents and coordinates parsing + semantic analysis.
 */
export class DocumentManager {
    readonly events = new EventEmitter<DocumentManagerEvents>();
    
    private readonly documents = new Map<DocumentUri, DocumentEntry>();
    private readonly parser: IncrementalParser;
    private readonly semanticModel: SemanticModel;
    private readonly logger: Logger;

    constructor(parser: IncrementalParser, semanticModel: SemanticModel, logger: Logger) {
        this.parser = parser;
        this.semanticModel = semanticModel;
        this.logger = logger.child('document-manager');
    }

    /**
     * Open a document and process it through the pipeline.
     */
    openDocument(
        uri: DocumentUri,
        text: string,
        version: number,
        languageId?: string,
        isStdlib: boolean = false
    ): void {
        const lang = languageId ?? this.detectLanguageId(uri);
        
        const entry: DocumentEntry = {
            uri,
            text,
            version,
            languageId: lang,
            isStdlib,
        };

        this.documents.set(uri, entry);
        this.processDocument(entry);
    }

    /**
     * Update a document with new text.
     */
    updateDocument(uri: DocumentUri, text: string, version: number): void {
        const entry = this.documents.get(uri);
        if (!entry) {
            // Document not open, treat as new
            this.openDocument(uri, text, version);
            return;
        }

        entry.text = text;
        entry.version = version;
        this.processDocument(entry);
    }

    /**
     * Close a document.
     */
    closeDocument(uri: DocumentUri): void {
        const entry = this.documents.get(uri);
        if (!entry) return;

        // Don't remove stdlib documents
        if (!entry.isStdlib) {
            this.documents.delete(uri);
            this.parser.removeDocument(uri);
            this.semanticModel.removeDocument(uri);
            this.events.emit('documentClosed', { uri });
        }
    }

    /**
     * Get the AST for a document.
     */
    getAst(uri: DocumentUri): DocumentAst | undefined {
        return this.documents.get(uri)?.ast;
    }

    /**
     * Get the text content of a document.
     */
    getText(uri: DocumentUri): string | undefined {
        return this.documents.get(uri)?.text;
    }

    /**
     * Check if a document is open.
     */
    isOpen(uri: DocumentUri): boolean {
        return this.documents.has(uri);
    }

    /**
     * Get all open document URIs.
     */
    getOpenDocuments(): DocumentUri[] {
        return [...this.documents.keys()];
    }

    /**
     * Process a document through the full pipeline.
     */
    private processDocument(entry: DocumentEntry): void {
        const startTime = Date.now();

        try {
            // Step 1: Parse
            const result = this.parser.updateDocument(entry.uri, entry.text, entry.version);
            entry.ast = result.ast;

            // Step 2: Index in semantic model
            this.semanticModel.indexDocument(result.ast);

            const elapsed = Date.now() - startTime;
            this.logger.debug(
                `Processed ${entry.uri} v${entry.version} in ${elapsed}ms ` +
                `(parse: ${result.parseTimeMs}ms, errors: ${result.errors.length})`
            );

            // Step 3: Emit event for diagnostics
            this.events.emit('documentProcessed', {
                uri: entry.uri,
                version: entry.version,
                isStdlib: entry.isStdlib,
            });
        } catch (error) {
            this.logger.error(`Error processing document ${entry.uri}`, error);
        }
    }

    /**
     * Detect language ID from URI.
     */
    private detectLanguageId(uri: DocumentUri): string {
        if (uri.endsWith('.kerml')) return 'kerml';
        return 'sysml';
    }
}
