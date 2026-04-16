import { describe, it, expect } from 'vitest';
import { computeNodeId, NodeIdMap } from '../identity.js';
import { SysMLMetatype, createNodeId } from '@sysml/protocol';

describe('computeNodeId', () => {
    it('should generate deterministic IDs', () => {
        const id1 = computeNodeId(undefined, SysMLMetatype.Package, 'MyPkg', 0);
        const id2 = computeNodeId(undefined, SysMLMetatype.Package, 'MyPkg', 0);
        expect(id1).toBe(id2);
    });

    it('should generate different IDs for different names', () => {
        const id1 = computeNodeId(undefined, SysMLMetatype.Package, 'Pkg1', 0);
        const id2 = computeNodeId(undefined, SysMLMetatype.Package, 'Pkg2', 0);
        expect(id1).not.toBe(id2);
    });

    it('should include parent ID in child ID', () => {
        const parentId = createNodeId('root/Package:MyPkg');
        const childId = computeNodeId(parentId, SysMLMetatype.PartDefinition, 'Vehicle', 0);
        expect(childId as string).toContain('MyPkg');
    });

    it('should use index for unnamed nodes', () => {
        const id = computeNodeId(undefined, SysMLMetatype.Comment, undefined, 3);
        expect(id as string).toContain('$3');
    });
});

describe('NodeIdMap', () => {
    it('should register and retrieve nodes', () => {
        const map = new NodeIdMap();
        const id = map.register(undefined, SysMLMetatype.Package, 'Test', 0);
        expect(map.has(id)).toBe(true);
        expect(map.size).toBe(1);
    });

    it('should return same ID for same path', () => {
        const map = new NodeIdMap();
        const id1 = map.register(undefined, SysMLMetatype.Package, 'Test', 0);
        const id2 = map.register(undefined, SysMLMetatype.Package, 'Test', 0);
        expect(id1).toBe(id2);
        expect(map.size).toBe(1);
    });

    it('should remove subtrees', () => {
        const map = new NodeIdMap();
        const parentId = map.register(undefined, SysMLMetatype.Package, 'Parent', 0);
        map.register(parentId, SysMLMetatype.PartDefinition, 'Child', 0);
        map.register(parentId, SysMLMetatype.PartDefinition, 'Child2', 1);
        expect(map.size).toBe(3);

        map.removeSubtree(parentId);
        expect(map.size).toBe(0);
    });

    it('should clear all entries', () => {
        const map = new NodeIdMap();
        map.register(undefined, SysMLMetatype.Package, 'A', 0);
        map.register(undefined, SysMLMetatype.Package, 'B', 1);
        expect(map.size).toBe(2);

        map.clear();
        expect(map.size).toBe(0);
    });
});
