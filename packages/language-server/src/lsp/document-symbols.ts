/**
 * @sysml/language-server - Document Symbol Service
 *
 * Provides document outline / symbol tree.
 */

import type { DocumentUri, Range } from '@sysml/protocol';
import type { SemanticModel } from '@sysml/semantics';
import type { DocumentManager } from '../document-manager.js';
import { isNamedElement, type AstNode } from '@sysml/ast';

export interface DocumentSymbol {
    name: string;
    detail: string;
    kind: SymbolKind;
    range: Range;
    selectionRange: Range;
    children: DocumentSymbol[];
}

export enum SymbolKind {
    Package = 4,
    Class = 5,
    Method = 6,
    Property = 7,
    Field = 8,
    Interface = 11,
    Enum = 10,
    Struct = 23,
}

/**
 * Maps SysML metatypes to LSP symbol kinds.
 */
function metatypeToSymbolKind(metatype: string): SymbolKind {
    if (metatype.includes('Package')) return SymbolKind.Package;
    if (metatype.includes('Definition')) return SymbolKind.Class;
    if (metatype.includes('Usage')) return SymbolKind.Property;
    if (metatype.includes('Interface')) return SymbolKind.Interface;
    if (metatype.includes('Port')) return SymbolKind.Interface;
    if (metatype.includes('Action')) return SymbolKind.Method;
    if (metatype.includes('Attribute')) return SymbolKind.Field;
    if (metatype.includes('Enum')) return SymbolKind.Enum;
    return SymbolKind.Struct;
}

/**
 * Provides document symbol (outline) information.
 */
export class DocumentSymbolService {
    private readonly semanticModel: SemanticModel;
    private readonly documentManager: DocumentManager;

    constructor(semanticModel: SemanticModel, documentManager: DocumentManager) {
        this.semanticModel = semanticModel;
        this.documentManager = documentManager;
    }

    /**
     * Get document symbols for a file.
     */
    getDocumentSymbols(uri: DocumentUri): DocumentSymbol[] {
        const doc = this.semanticModel.getDocument(uri);
        if (!doc) return [];

        return this.buildSymbolTree(doc.root, doc);
    }

    private buildSymbolTree(
        node: AstNode,
        doc: import('@sysml/ast').DocumentAst
    ): DocumentSymbol[] {
        const symbols: DocumentSymbol[] = [];

        for (const childId of node.children) {
            const child = doc.nodes.get(childId);
            if (!child) continue;

            if (isNamedElement(child) && child.declaredName) {
                const range = child.range ?? {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                };

                const symbol: DocumentSymbol = {
                    name: child.declaredName,
                    detail: child.type,
                    kind: metatypeToSymbolKind(child.type),
                    range,
                    selectionRange: range,
                    children: this.buildSymbolTree(child, doc),
                };

                symbols.push(symbol);
            } else {
                // If the child isn't named, still recurse to find named descendants
                symbols.push(...this.buildSymbolTree(child, doc));
            }
        }

        return symbols;
    }
}
