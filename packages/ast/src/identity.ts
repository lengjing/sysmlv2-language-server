/**
 * @sysml/ast - Node Identity System
 *
 * Provides stable node IDs that persist across incremental updates.
 * Uses a content-hash based approach: nodes are identified by their
 * structural position (parent path + type + name/index).
 */

import { createNodeId, type NodeId, type SysMLMetatype } from '@sysml/protocol';

/**
 * Generate a stable NodeId based on structural position.
 *
 * The ID encodes the node's position in the tree so that small edits
 * don't invalidate all IDs. This enables external systems (CRDT, AI agents)
 * to maintain stable references to nodes.
 *
 * Format: `{parentId}/{type}:{nameOrIndex}`
 */
export function computeNodeId(
    parentId: NodeId | undefined,
    type: SysMLMetatype | string,
    name: string | undefined,
    index: number
): NodeId {
    const key = name ?? `$${index}`;
    const prefix = parentId ?? 'root';
    return createNodeId(`${prefix}/${type}:${key}`);
}

/**
 * NodeIdMap manages the mapping between AST nodes and their stable IDs.
 * Supports incremental updates - when a subtree changes, only affected
 * IDs are recomputed.
 */
export class NodeIdMap {
    private readonly idToPath = new Map<NodeId, string>();
    private readonly pathToId = new Map<string, NodeId>();

    /**
     * Register a node at a given structural path.
     * Returns existing ID if path was seen before, otherwise creates a new one.
     */
    register(
        parentId: NodeId | undefined,
        type: SysMLMetatype | string,
        name: string | undefined,
        index: number
    ): NodeId {
        const id = computeNodeId(parentId, type, name, index);
        const path = id as string;
        
        if (this.pathToId.has(path)) {
            return this.pathToId.get(path)!;
        }
        
        this.idToPath.set(id, path);
        this.pathToId.set(path, id);
        return id;
    }

    /** Check if a node ID exists */
    has(id: NodeId): boolean {
        return this.idToPath.has(id);
    }

    /** Get the path for a node ID */
    getPath(id: NodeId): string | undefined {
        return this.idToPath.get(id);
    }

    /** Remove a node and its subtree */
    removeSubtree(id: NodeId): void {
        const prefix = id as string;
        const toRemove: NodeId[] = [];
        
        for (const [nodeId, path] of this.idToPath) {
            if (path === prefix || path.startsWith(prefix + '/')) {
                toRemove.push(nodeId);
            }
        }
        
        for (const nodeId of toRemove) {
            const path = this.idToPath.get(nodeId);
            if (path) {
                this.pathToId.delete(path);
            }
            this.idToPath.delete(nodeId);
        }
    }

    /** Clear all mappings */
    clear(): void {
        this.idToPath.clear();
        this.pathToId.clear();
    }

    /** Get the number of registered nodes */
    get size(): number {
        return this.idToPath.size;
    }
}
