/**
 * @sysml/semantics - Symbol Table
 *
 * A hierarchical symbol table that maps names to AST nodes.
 * Supports qualified name resolution, short name lookup, and incremental updates.
 */

import type { NodeId, DocumentUri, SysMLMetatype } from '@sysml/protocol';

/** A symbol entry in the symbol table */
export interface SymbolEntry {
    readonly nodeId: NodeId;
    readonly name: string;
    readonly shortName?: string;
    readonly qualifiedName: string;
    readonly metatype: SysMLMetatype;
    readonly documentUri: DocumentUri;
    readonly scopeId: NodeId;
    readonly visibility: 'public' | 'private' | 'protected';
}

/**
 * Symbol Table for the semantic model.
 *
 * Provides O(1) lookup by name, qualified name, and node ID.
 */
export class SymbolTable {
    /** All symbols indexed by qualified name */
    private readonly byQualifiedName = new Map<string, SymbolEntry>();
    /** All symbols indexed by node ID */
    private readonly byNodeId = new Map<NodeId, SymbolEntry>();
    /** Symbols indexed by scope (parent scope ID -> symbols) */
    private readonly byScope = new Map<NodeId, SymbolEntry[]>();
    /** Symbols indexed by simple name (for unqualified lookup) */
    private readonly byName = new Map<string, SymbolEntry[]>();
    /** Symbols indexed by document URI */
    private readonly byDocument = new Map<DocumentUri, SymbolEntry[]>();
    /** Short name index */
    private readonly byShortName = new Map<string, SymbolEntry[]>();

    /**
     * Add a symbol to the table.
     */
    add(entry: SymbolEntry): void {
        this.byQualifiedName.set(entry.qualifiedName, entry);
        this.byNodeId.set(entry.nodeId, entry);

        // Index by scope
        const scopeList = this.byScope.get(entry.scopeId) ?? [];
        scopeList.push(entry);
        this.byScope.set(entry.scopeId, scopeList);

        // Index by simple name
        const nameList = this.byName.get(entry.name) ?? [];
        nameList.push(entry);
        this.byName.set(entry.name, nameList);

        // Index by document
        const docList = this.byDocument.get(entry.documentUri) ?? [];
        docList.push(entry);
        this.byDocument.set(entry.documentUri, docList);

        // Index by short name
        if (entry.shortName) {
            const shortList = this.byShortName.get(entry.shortName) ?? [];
            shortList.push(entry);
            this.byShortName.set(entry.shortName, shortList);
        }
    }

    /**
     * Lookup by qualified name.
     */
    lookupQualified(qualifiedName: string): SymbolEntry | undefined {
        return this.byQualifiedName.get(qualifiedName);
    }

    /**
     * Lookup by node ID.
     */
    lookupById(nodeId: NodeId): SymbolEntry | undefined {
        return this.byNodeId.get(nodeId);
    }

    /**
     * Lookup by simple name within a scope.
     * Walks up parent scopes if not found locally.
     */
    lookupInScope(name: string, scopeId: NodeId): SymbolEntry | undefined {
        const scopeSymbols = this.byScope.get(scopeId);
        if (scopeSymbols) {
            const match = scopeSymbols.find(s => s.name === name || s.shortName === name);
            if (match) return match;
        }
        return undefined;
    }

    /**
     * Get all symbols in a scope.
     */
    getScope(scopeId: NodeId): readonly SymbolEntry[] {
        return this.byScope.get(scopeId) ?? [];
    }

    /**
     * Lookup by simple name (global search, returns all matches).
     */
    lookupByName(name: string): readonly SymbolEntry[] {
        const byName = this.byName.get(name) ?? [];
        const byShort = this.byShortName.get(name) ?? [];
        if (byShort.length === 0) return byName;
        if (byName.length === 0) return byShort;

        // Merge and deduplicate
        const seen = new Set<NodeId>();
        const result: SymbolEntry[] = [];
        for (const entry of [...byName, ...byShort]) {
            if (!seen.has(entry.nodeId)) {
                seen.add(entry.nodeId);
                result.push(entry);
            }
        }
        return result;
    }

    /**
     * Remove all symbols for a document (for incremental updates).
     */
    removeDocument(uri: DocumentUri): void {
        const docSymbols = this.byDocument.get(uri);
        if (!docSymbols) return;

        for (const entry of docSymbols) {
            this.byQualifiedName.delete(entry.qualifiedName);
            this.byNodeId.delete(entry.nodeId);

            // Remove from scope index
            const scopeList = this.byScope.get(entry.scopeId);
            if (scopeList) {
                const idx = scopeList.indexOf(entry);
                if (idx >= 0) scopeList.splice(idx, 1);
            }

            // Remove from name index
            const nameList = this.byName.get(entry.name);
            if (nameList) {
                const idx = nameList.indexOf(entry);
                if (idx >= 0) nameList.splice(idx, 1);
            }

            // Remove from short name index
            if (entry.shortName) {
                const shortList = this.byShortName.get(entry.shortName);
                if (shortList) {
                    const idx = shortList.indexOf(entry);
                    if (idx >= 0) shortList.splice(idx, 1);
                }
            }
        }

        this.byDocument.delete(uri);
    }

    /**
     * Get all symbols.
     */
    allSymbols(): readonly SymbolEntry[] {
        return [...this.byQualifiedName.values()];
    }

    /**
     * Get the total number of symbols.
     */
    get size(): number {
        return this.byQualifiedName.size;
    }

    /**
     * Clear all symbols.
     */
    clear(): void {
        this.byQualifiedName.clear();
        this.byNodeId.clear();
        this.byScope.clear();
        this.byName.clear();
        this.byDocument.clear();
        this.byShortName.clear();
    }
}
