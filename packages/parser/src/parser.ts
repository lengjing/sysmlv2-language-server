/**
 * @sysml/parser - Parser API
 *
 * Clean parsing interface that produces DocumentAst.
 * Abstracts away Langium internals.
 */

import type { DocumentUri, Range } from '@sysml/protocol';
import type { DocumentAst, ParseErrorInfo } from '@sysml/ast';
import { LangiumAstAdapter } from './langium-adapter.js';

export interface ParseOptions {
    /** Document URI */
    uri: DocumentUri;
    /** Source text */
    text: string;
    /** Language ID ('sysml' or 'kerml') */
    languageId?: string;
    /** Document version */
    version?: number;
}

export interface ParseResult {
    /** The parsed AST */
    ast: DocumentAst;
    /** Whether parsing succeeded without errors */
    success: boolean;
    /** Parse errors */
    errors: readonly ParseErrorInfo[];
    /** Time taken to parse (ms) */
    parseTimeMs: number;
}

/**
 * SysML/KerML Parser.
 *
 * Wraps Langium parsing and converts to our AST format.
 */
export class SysMLParser {
    private readonly adapter: LangiumAstAdapter;

    constructor() {
        this.adapter = new LangiumAstAdapter();
    }

    /**
     * Parse SysML/KerML source text.
     */
    parse(options: ParseOptions): ParseResult {
        const startTime = Date.now();

        try {
            const ast = this.adapter.parse(options.text, options.uri, options.version ?? 0);
            const parseTimeMs = Date.now() - startTime;

            return {
                ast,
                success: ast.errors.length === 0,
                errors: ast.errors,
                parseTimeMs,
            };
        } catch (error) {
            const parseTimeMs = Date.now() - startTime;
            const errorMsg = error instanceof Error ? error.message : String(error);

            // Return a minimal AST with the error
            const { DocumentAstBuilder } = require('@sysml/ast');
            const builder = new DocumentAstBuilder(options.uri);
            builder.setVersion(options.version ?? 0);
            builder.createRootNamespace();

            const ast = builder.build();
            // We need to add errors manually since build() returns empty errors
            const errorAst: DocumentAst = {
                ...ast,
                errors: [{
                    message: `Parse error: ${errorMsg}`,
                    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                }],
            };

            return {
                ast: errorAst,
                success: false,
                errors: errorAst.errors,
                parseTimeMs,
            };
        }
    }

    /**
     * Dispose parser resources.
     */
    dispose(): void {
        this.adapter.dispose();
    }
}
