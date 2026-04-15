/**
 * @sysml/semantics - Semantic Model
 *
 * The semantic model is the central data structure that holds:
 * - Symbol table
 * - Scope resolver
 * - Type registry
 * - Validation engine
 *
 * It processes DocumentAst objects and maintains the full semantic state.
 */

import type { NodeId, DocumentUri, Diagnostic } from '@sysml/protocol';
import type { AstNode, DocumentAst, NamedElement } from '@sysml/ast';
import { isNamedElement, walkAst } from '@sysml/ast';
import { SymbolTable, type SymbolEntry } from './symbol-table.js';
import { ScopeResolver } from './scope.js';
import { TypeRegistry, type SysMLType } from './type-system.js';
import { ValidationEngine, ValidationRegistry, type ValidationContext } from './validation.js';
import { getBuiltinRules } from './builtin-rules.js';

/**
 * The Semantic Model for the SysML v2 toolchain.
 */
export class SemanticModel {
    readonly symbolTable: SymbolTable;
    readonly scopeResolver: ScopeResolver;
    readonly typeRegistry: TypeRegistry;
    readonly validationRegistry: ValidationRegistry;
    readonly validationEngine: ValidationEngine;

    /** Documents indexed by URI */
    private readonly documents = new Map<DocumentUri, DocumentAst>();

    constructor() {
        this.symbolTable = new SymbolTable();
        this.scopeResolver = new ScopeResolver(this.symbolTable);
        this.typeRegistry = new TypeRegistry();
        this.validationRegistry = new ValidationRegistry();
        this.validationEngine = new ValidationEngine(this.validationRegistry);

        // Register built-in rules
        this.validationRegistry.registerAll(getBuiltinRules());
    }

    /**
     * Index a document - extract symbols and types.
     */
    indexDocument(doc: DocumentAst): void {
        // Remove old data for this document (incremental update)
        this.removeDocument(doc.uri);

        // Store the document
        this.documents.set(doc.uri, doc);

        // Phase 1: Extract symbols
        this.extractSymbols(doc);

        // Phase 2: Register types
        this.registerTypes(doc);

        // Phase 3: Invalidate scope cache
        this.scopeResolver.invalidateDocument(doc);
    }

    /**
     * Remove a document from the semantic model.
     */
    removeDocument(uri: DocumentUri): void {
        this.symbolTable.removeDocument(uri);
        this.typeRegistry.removeByDocument(this.symbolTable, uri);

        const doc = this.documents.get(uri);
        if (doc) {
            this.scopeResolver.invalidateDocument(doc);
        }
        this.documents.delete(uri);
    }

    /**
     * Validate a document.
     */
    validateDocument(uri: DocumentUri): Diagnostic[] {
        const doc = this.documents.get(uri);
        if (!doc) return [];

        const context = this.createValidationContext(doc);
        return this.validationEngine.validate(doc, context);
    }

    /**
     * Resolve a symbol by name from a given scope.
     */
    resolveSymbol(name: string, fromNodeId: NodeId, docUri: DocumentUri): SymbolEntry | undefined {
        const doc = this.documents.get(docUri);
        if (!doc) return undefined;

        const scope = this.scopeResolver.getScopeFor(fromNodeId, doc);
        return scope.resolve(name);
    }

    /**
     * Resolve a qualified name.
     */
    resolveQualifiedName(qualifiedName: string, fromNodeId: NodeId, docUri: DocumentUri): SymbolEntry | undefined {
        const doc = this.documents.get(docUri);
        if (!doc) return undefined;

        const scope = this.scopeResolver.getScopeFor(fromNodeId, doc);
        return this.scopeResolver.resolveQualifiedName(qualifiedName, scope);
    }

    /**
     * Get all documents.
     */
    getDocuments(): ReadonlyMap<DocumentUri, DocumentAst> {
        return this.documents;
    }

    /**
     * Get a document by URI.
     */
    getDocument(uri: DocumentUri): DocumentAst | undefined {
        return this.documents.get(uri);
    }

    /**
     * Clear the entire semantic model.
     */
    clear(): void {
        this.symbolTable.clear();
        this.scopeResolver.clearCache();
        this.typeRegistry.clear();
        this.documents.clear();
    }

    // --- Private Methods ---

    private extractSymbols(doc: DocumentAst): void {
        walkAst(doc, {
            visitNamedElement: (node: NamedElement) => {
                if (!node.declaredName && !node.declaredShortName) return;

                const qualifiedName = node.qualifiedName ?? this.computeQualifiedName(node, doc);
                const entry: SymbolEntry = {
                    nodeId: node.id,
                    name: node.declaredName ?? node.declaredShortName ?? '',
                    shortName: node.declaredShortName,
                    qualifiedName,
                    metatype: node.type,
                    documentUri: doc.uri,
                    scopeId: node.parent ?? doc.root.id,
                    visibility: node.visibility ?? 'public',
                };
                this.symbolTable.add(entry);
            },
        });
    }

    private registerTypes(doc: DocumentAst): void {
        for (const node of doc.nodes.values()) {
            if (!('specializations' in node)) continue;

            const typeNode = node as any;
            const baseNode = node as AstNode;
            const name = isNamedElement(baseNode) ? (baseNode as NamedElement).declaredName ?? '' : '';
            const sysmlType: SysMLType = {
                nodeId: node.id,
                name,
                metatype: node.type,
                supertypes: typeNode.specializations
                    ?.filter((s: any) => s.targetId)
                    .map((s: any) => s.targetId) ?? [],
                subtypes: [],
            };
            this.typeRegistry.registerType(sysmlType);
        }
    }

    private computeQualifiedName(node: NamedElement, doc: DocumentAst): string {
        const parts: string[] = [];
        let current: AstNode | undefined = node;

        while (current) {
            if (isNamedElement(current) && current.declaredName) {
                parts.unshift(current.declaredName);
            }
            current = current.parent ? doc.nodes.get(current.parent) : undefined;
        }

        return parts.join('::');
    }

    private createValidationContext(doc: DocumentAst): ValidationContext {
        return {
            document: doc,
            resolveSymbol: (name: string, fromNodeId: NodeId) => {
                return this.resolveSymbol(name, fromNodeId, doc.uri);
            },
            conformsTo: (subTypeId: NodeId, superTypeId: NodeId) => {
                return this.typeRegistry.conformsTo(subTypeId, superTypeId);
            },
            getVisibleSymbols: (scopeId: NodeId) => {
                const scope = this.scopeResolver.getScopeFor(scopeId, doc);
                return scope.allVisible();
            },
        };
    }
}
