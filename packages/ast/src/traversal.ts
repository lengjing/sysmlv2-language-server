/**
 * @sysml/ast - AST Traversal Utilities
 *
 * Provides visitor pattern and traversal functions for the AST.
 */

import type { NodeId } from '@sysml/protocol';
import type { AstNode, DocumentAst, NamedElement } from './nodes.js';

/** Visitor interface for AST traversal */
export interface AstVisitor<T = void> {
    visitNode?(node: AstNode, context: TraversalContext): T;
    visitNamedElement?(node: NamedElement, context: TraversalContext): T;
}

export interface TraversalContext {
    readonly depth: number;
    readonly path: readonly NodeId[];
    readonly document: DocumentAst;
    /** Skip visiting children of the current node */
    skipChildren(): void;
}

/**
 * Walk the AST depth-first, calling the visitor for each node.
 */
export function walkAst(
    doc: DocumentAst,
    visitor: AstVisitor,
    startNode?: AstNode
): void {
    const root = startNode ?? doc.root;
    let skipChildrenFlag = false;

    function visit(node: AstNode, depth: number, path: NodeId[]): void {
        skipChildrenFlag = false;
        
        const context: TraversalContext = {
            depth,
            path: [...path, node.id],
            document: doc,
            skipChildren: () => { skipChildrenFlag = true; },
        };

        // Call the most specific visitor method
        if (isNamedElement(node) && visitor.visitNamedElement) {
            visitor.visitNamedElement(node, context);
        } else if (visitor.visitNode) {
            visitor.visitNode(node, context);
        }

        if (skipChildrenFlag) return;

        // Visit children
        for (const childId of node.children) {
            const child = doc.nodes.get(childId);
            if (child) {
                visit(child, depth + 1, [...path, node.id]);
            }
        }
    }

    visit(root, 0, []);
}

/**
 * Find all nodes matching a predicate.
 */
export function findNodes(
    doc: DocumentAst,
    predicate: (node: AstNode) => boolean
): AstNode[] {
    const results: AstNode[] = [];
    
    walkAst(doc, {
        visitNode(node) {
            if (predicate(node)) {
                results.push(node);
            }
        },
        visitNamedElement(node) {
            if (predicate(node)) {
                results.push(node);
            }
        },
    });
    
    return results;
}

/**
 * Find a node by its ID.
 */
export function findNodeById(doc: DocumentAst, id: NodeId): AstNode | undefined {
    return doc.nodes.get(id);
}

/**
 * Find a named element by its qualified name.
 */
export function findByQualifiedName(
    doc: DocumentAst,
    qualifiedName: string
): NamedElement | undefined {
    for (const node of doc.nodes.values()) {
        if (isNamedElement(node) && node.qualifiedName === qualifiedName) {
            return node;
        }
    }
    return undefined;
}

/**
 * Get all ancestors of a node (from immediate parent to root).
 */
export function getAncestors(doc: DocumentAst, nodeId: NodeId): AstNode[] {
    const ancestors: AstNode[] = [];
    let current = doc.nodes.get(nodeId);
    
    while (current?.parent) {
        const parent = doc.nodes.get(current.parent);
        if (!parent) break;
        ancestors.push(parent);
        current = parent;
    }
    
    return ancestors;
}

/**
 * Type guard for NamedElement.
 */
export function isNamedElement(node: AstNode): node is NamedElement {
    return 'declaredName' in node || 'declaredShortName' in node;
}

/**
 * Get the effective name of a named element (declaredName or declaredShortName).
 */
export function getEffectiveName(node: AstNode): string | undefined {
    if (isNamedElement(node)) {
        return node.declaredName ?? node.declaredShortName;
    }
    return undefined;
}
