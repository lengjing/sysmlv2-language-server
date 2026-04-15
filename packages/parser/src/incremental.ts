/**
 * @sysml/parser - Incremental Parser
 *
 * Supports incremental document updates by tracking which parts
 * of the AST need to be re-parsed when text changes occur.
 */

import type { DocumentUri, Range } from '@sysml/protocol';
import type { DocumentAst } from '@sysml/ast';
import { SysMLParser, type ParseOptions, type ParseResult } from './parser.js';

interface DocumentState {
    text: string;
    version: number;
    ast: DocumentAst;
}

/**
 * Incremental parser that caches parse results and minimizes re-parsing.
 */
export class IncrementalParser {
    private readonly parser: SysMLParser;
    private readonly cache = new Map<DocumentUri, DocumentState>();

    constructor() {
        this.parser = new SysMLParser();
    }

    /**
     * Parse a full document (initial parse).
     */
    parseDocument(options: ParseOptions): ParseResult {
        const result = this.parser.parse(options);

        // Cache the result
        this.cache.set(options.uri, {
            text: options.text,
            version: options.version ?? 0,
            ast: result.ast,
        });

        return result;
    }

    /**
     * Apply incremental changes and re-parse.
     *
     * Currently does full re-parse on any change.
     * Future optimization: only re-parse affected subtrees.
     */
    applyChanges(
        uri: DocumentUri,
        version: number,
        changes: readonly TextChange[]
    ): ParseResult {
        const cached = this.cache.get(uri);
        if (!cached) {
            throw new Error(`Document '${uri}' not found in cache. Call parseDocument() first.`);
        }

        // Apply text changes
        let text = cached.text;
        for (const change of changes) {
            text = this.applyTextChange(text, change);
        }

        // Re-parse the full document
        // TODO: Implement true incremental parsing by identifying affected subtrees
        return this.parseDocument({
            uri,
            text,
            version,
        });
    }

    /**
     * Update a document with new full text.
     */
    updateDocument(uri: DocumentUri, text: string, version: number): ParseResult {
        return this.parseDocument({ uri, text, version });
    }

    /**
     * Remove a document from the cache.
     */
    removeDocument(uri: DocumentUri): void {
        this.cache.delete(uri);
    }

    /**
     * Get cached AST for a document.
     */
    getCachedAst(uri: DocumentUri): DocumentAst | undefined {
        return this.cache.get(uri)?.ast;
    }

    /**
     * Dispose all resources.
     */
    dispose(): void {
        this.cache.clear();
        this.parser.dispose();
    }

    // --- Private ---

    private applyTextChange(text: string, change: TextChange): string {
        const lines = text.split('\n');
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        const startChar = change.range.start.character;
        const endChar = change.range.end.character;

        // Calculate offset
        let startOffset = 0;
        for (let i = 0; i < startLine && i < lines.length; i++) {
            startOffset += lines[i].length + 1; // +1 for newline
        }
        startOffset += startChar;

        let endOffset = 0;
        for (let i = 0; i < endLine && i < lines.length; i++) {
            endOffset += lines[i].length + 1;
        }
        endOffset += endChar;

        return text.substring(0, startOffset) + change.text + text.substring(endOffset);
    }
}

interface TextChange {
    readonly range: Range;
    readonly text: string;
}
