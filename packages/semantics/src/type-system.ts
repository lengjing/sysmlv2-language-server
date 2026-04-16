/**
 * @sysml/semantics - Type System
 *
 * Implements basic SysML v2 type checking:
 * - Specialization hierarchy
 * - Type conformance
 * - Feature typing
 */

import type { NodeId, SysMLMetatype } from '@sysml/protocol';
import type { SymbolTable } from './symbol-table.js';

/** A type in the SysML type system */
export interface SysMLType {
    readonly nodeId: NodeId;
    readonly name: string;
    readonly metatype: SysMLMetatype;
    /** Direct supertypes */
    readonly supertypes: readonly NodeId[];
    /** Direct subtypes (computed) */
    readonly subtypes: NodeId[];
}

/**
 * Type Registry - manages the type hierarchy.
 */
export class TypeRegistry {
    private readonly types = new Map<NodeId, SysMLType>();
    private readonly specializationEdges = new Map<NodeId, Set<NodeId>>(); // child -> parents
    private readonly reverseEdges = new Map<NodeId, Set<NodeId>>(); // parent -> children

    /**
     * Register a type.
     */
    registerType(type: SysMLType): void {
        this.types.set(type.nodeId, type);

        for (const superTypeId of type.supertypes) {
            // Forward edge: child -> parent
            let parents = this.specializationEdges.get(type.nodeId);
            if (!parents) {
                parents = new Set();
                this.specializationEdges.set(type.nodeId, parents);
            }
            parents.add(superTypeId);

            // Reverse edge: parent -> child
            let children = this.reverseEdges.get(superTypeId);
            if (!children) {
                children = new Set();
                this.reverseEdges.set(superTypeId, children);
            }
            children.add(type.nodeId);
        }
    }

    /**
     * Get a type by node ID.
     */
    getType(nodeId: NodeId): SysMLType | undefined {
        return this.types.get(nodeId);
    }

    /**
     * Check if `subTypeId` conforms to (is a subtype of) `superTypeId`.
     * Uses transitive closure of specialization.
     */
    conformsTo(subTypeId: NodeId, superTypeId: NodeId): boolean {
        if (subTypeId === superTypeId) return true;

        const visited = new Set<NodeId>();
        const queue: NodeId[] = [subTypeId];

        while (queue.length > 0) {
            const current = queue.pop()!;
            if (current === superTypeId) return true;
            if (visited.has(current)) continue;
            visited.add(current);

            const parents = this.specializationEdges.get(current);
            if (parents) {
                for (const parent of parents) {
                    if (!visited.has(parent)) {
                        queue.push(parent);
                    }
                }
            }
        }

        return false;
    }

    /**
     * Get all supertypes (transitive).
     */
    getAllSupertypes(nodeId: NodeId): readonly NodeId[] {
        const result: NodeId[] = [];
        const visited = new Set<NodeId>();
        const queue: NodeId[] = [nodeId];

        while (queue.length > 0) {
            const current = queue.pop()!;
            if (visited.has(current)) continue;
            visited.add(current);

            const parents = this.specializationEdges.get(current);
            if (parents) {
                for (const parent of parents) {
                    if (!visited.has(parent)) {
                        result.push(parent);
                        queue.push(parent);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Get direct subtypes.
     */
    getDirectSubtypes(nodeId: NodeId): readonly NodeId[] {
        return [...(this.reverseEdges.get(nodeId) ?? [])];
    }

    /**
     * Detect cycles in the specialization hierarchy.
     */
    detectCycles(): NodeId[][] {
        const cycles: NodeId[][] = [];
        const globalVisited = new Set<NodeId>();

        for (const nodeId of this.types.keys()) {
            if (globalVisited.has(nodeId)) continue;

            const path: NodeId[] = [];
            const pathSet = new Set<NodeId>();

            const dfs = (current: NodeId): void => {
                if (pathSet.has(current)) {
                    // Found a cycle
                    const cycleStart = path.indexOf(current);
                    cycles.push(path.slice(cycleStart));
                    return;
                }
                if (globalVisited.has(current)) return;

                pathSet.add(current);
                path.push(current);

                const parents = this.specializationEdges.get(current);
                if (parents) {
                    for (const parent of parents) {
                        dfs(parent);
                    }
                }

                path.pop();
                pathSet.delete(current);
                globalVisited.add(current);
            };

            dfs(nodeId);
        }

        return cycles;
    }

    /**
     * Remove all types for a document.
     */
    removeByDocument(symbolTable: SymbolTable, uri: string): void {
        // Find all symbols from this document
        const docSymbols = symbolTable.allSymbols().filter(s => s.documentUri === uri);

        for (const sym of docSymbols) {
            this.types.delete(sym.nodeId);
            this.specializationEdges.delete(sym.nodeId);

            // Clean up reverse edges
            for (const [parentId, children] of this.reverseEdges) {
                children.delete(sym.nodeId);
                if (children.size === 0) {
                    this.reverseEdges.delete(parentId);
                }
            }
        }
    }

    /**
     * Clear all types.
     */
    clear(): void {
        this.types.clear();
        this.specializationEdges.clear();
        this.reverseEdges.clear();
    }
}
