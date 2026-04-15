/**
 * @sysml/semantics - Scope Resolution
 *
 * Implements lexical scoping for SysML v2.
 * Handles qualified name resolution, import resolution, and
 * the SysML-specific visibility rules.
 */

import type { NodeId } from '@sysml/protocol';
import type { SymbolEntry, SymbolTable } from './symbol-table.js';
import type { AstNode, NamespaceNode, DocumentAst } from '@sysml/ast';

/** A scope that provides name resolution */
export interface Scope {
    /** Resolve a name in this scope */
    resolve(name: string): SymbolEntry | undefined;
    /** Get all visible symbols in this scope */
    allVisible(): readonly SymbolEntry[];
    /** The parent scope (for upward resolution) */
    readonly parent?: Scope;
}

/**
 * A concrete scope backed by a namespace node.
 */
export class NamespaceScope implements Scope {
    readonly parent?: Scope;
    private readonly localSymbols: readonly SymbolEntry[];
    private readonly importedSymbols: SymbolEntry[];

    constructor(
        localSymbols: readonly SymbolEntry[],
        parent?: Scope,
        importedSymbols: SymbolEntry[] = []
    ) {
        this.localSymbols = localSymbols;
        this.parent = parent;
        this.importedSymbols = importedSymbols;
    }

    resolve(name: string): SymbolEntry | undefined {
        // 1. Check local symbols first
        const local = this.localSymbols.find(
            s => s.name === name || s.shortName === name
        );
        if (local) return local;

        // 2. Check imported symbols
        const imported = this.importedSymbols.find(
            s => s.name === name || s.shortName === name
        );
        if (imported) return imported;

        // 3. Delegate to parent scope
        return this.parent?.resolve(name);
    }

    allVisible(): readonly SymbolEntry[] {
        const parentVisible = this.parent?.allVisible() ?? [];
        return [...this.localSymbols, ...this.importedSymbols, ...parentVisible];
    }
}

/**
 * Global scope containing all top-level symbols.
 */
export class GlobalScope implements Scope {
    readonly parent = undefined;
    private readonly symbolTable: SymbolTable;

    constructor(symbolTable: SymbolTable) {
        this.symbolTable = symbolTable;
    }

    resolve(name: string): SymbolEntry | undefined {
        const matches = this.symbolTable.lookupByName(name);
        // Return the first public match
        return matches.find(s => s.visibility === 'public');
    }

    allVisible(): readonly SymbolEntry[] {
        return this.symbolTable.allSymbols().filter(s => s.visibility === 'public');
    }
}

/**
 * Scope resolver - builds scope chains and resolves names.
 */
export class ScopeResolver {
    private readonly symbolTable: SymbolTable;
    private readonly globalScope: GlobalScope;
    private readonly scopeCache = new Map<NodeId, Scope>();

    constructor(symbolTable: SymbolTable) {
        this.symbolTable = symbolTable;
        this.globalScope = new GlobalScope(symbolTable);
    }

    /**
     * Get the scope for a node (with caching).
     */
    getScopeFor(nodeId: NodeId, doc: DocumentAst): Scope {
        const cached = this.scopeCache.get(nodeId);
        if (cached) return cached;

        const node = doc.nodes.get(nodeId);
        if (!node) return this.globalScope;

        const scope = this.buildScope(node, doc);
        this.scopeCache.set(nodeId, scope);
        return scope;
    }

    /**
     * Resolve a qualified name (e.g., "A::B::C") segment by segment.
     */
    resolveQualifiedName(qualifiedName: string, fromScope: Scope): SymbolEntry | undefined {
        // First try direct lookup
        const direct = this.symbolTable.lookupQualified(qualifiedName);
        if (direct) return direct;

        // Segment-by-segment resolution
        const segments = qualifiedName.split('::');
        let currentScope = fromScope;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const entry = currentScope.resolve(segment);

            if (!entry) return undefined;

            if (i === segments.length - 1) {
                return entry;
            }

            // Navigate into the scope of the resolved symbol
            const childScope = this.symbolTable.getScope(entry.nodeId);
            currentScope = new NamespaceScope(childScope, this.globalScope);
        }

        return undefined;
    }

    /**
     * Invalidate cached scopes for a document.
     */
    invalidateDocument(doc: DocumentAst): void {
        for (const nodeId of doc.nodes.keys()) {
            this.scopeCache.delete(nodeId);
        }
    }

    /**
     * Clear all cached scopes.
     */
    clearCache(): void {
        this.scopeCache.clear();
    }

    private buildScope(node: AstNode, doc: DocumentAst): Scope {
        // Get parent scope
        const parentScope = node.parent
            ? this.getScopeFor(node.parent, doc)
            : this.globalScope;

        // Get local symbols for this scope
        const localSymbols = this.symbolTable.getScope(node.id);

        // Resolve imports if this is a namespace
        const importedSymbols = this.resolveImports(node, doc);

        return new NamespaceScope(localSymbols, parentScope, importedSymbols);
    }

    private resolveImports(node: AstNode, _doc: DocumentAst): SymbolEntry[] {
        const imported: SymbolEntry[] = [];

        if (!isNamespaceNode(node)) return imported;

        for (const imp of node.imports) {
            if (imp.isWildcard) {
                // Import all public members from the namespace
                const targetEntry = this.symbolTable.lookupQualified(imp.qualifiedName);
                if (targetEntry) {
                    const members = this.symbolTable.getScope(targetEntry.nodeId);
                    for (const member of members) {
                        if (member.visibility === 'public') {
                            imported.push(member);
                        }
                    }
                }
            } else {
                // Import a specific member
                const entry = this.symbolTable.lookupQualified(imp.qualifiedName);
                if (entry) {
                    imported.push(entry);
                }
            }
        }

        return imported;
    }
}

function isNamespaceNode(node: AstNode): node is NamespaceNode {
    return 'imports' in node && 'ownedMembers' in node;
}
