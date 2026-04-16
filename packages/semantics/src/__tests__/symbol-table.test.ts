import { describe, it, expect } from 'vitest';
import { SymbolTable } from '../symbol-table.js';
import { SysMLMetatype, createNodeId } from '@sysml/protocol';

describe('SymbolTable', () => {
    it('should add and lookup symbols by qualified name', () => {
        const table = new SymbolTable();
        table.add({
            nodeId: createNodeId('node1'),
            name: 'Vehicle',
            qualifiedName: 'MyPkg::Vehicle',
            metatype: SysMLMetatype.PartDefinition,
            documentUri: 'file:///test.sysml',
            scopeId: createNodeId('root'),
            visibility: 'public',
        });

        const result = table.lookupQualified('MyPkg::Vehicle');
        expect(result).toBeDefined();
        expect(result!.name).toBe('Vehicle');
    });

    it('should lookup by simple name', () => {
        const table = new SymbolTable();
        table.add({
            nodeId: createNodeId('node1'),
            name: 'Engine',
            qualifiedName: 'Pkg::Engine',
            metatype: SysMLMetatype.PartDefinition,
            documentUri: 'file:///test.sysml',
            scopeId: createNodeId('root'),
            visibility: 'public',
        });

        const results = table.lookupByName('Engine');
        expect(results).toHaveLength(1);
        expect(results[0].qualifiedName).toBe('Pkg::Engine');
    });

    it('should support short name lookup', () => {
        const table = new SymbolTable();
        table.add({
            nodeId: createNodeId('node1'),
            name: 'Vehicle',
            shortName: 'veh',
            qualifiedName: 'MyPkg::Vehicle',
            metatype: SysMLMetatype.PartDefinition,
            documentUri: 'file:///test.sysml',
            scopeId: createNodeId('root'),
            visibility: 'public',
        });

        const results = table.lookupByName('veh');
        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Vehicle');
    });

    it('should remove document symbols', () => {
        const table = new SymbolTable();
        table.add({
            nodeId: createNodeId('node1'),
            name: 'A',
            qualifiedName: 'A',
            metatype: SysMLMetatype.Package,
            documentUri: 'file:///a.sysml',
            scopeId: createNodeId('root'),
            visibility: 'public',
        });
        table.add({
            nodeId: createNodeId('node2'),
            name: 'B',
            qualifiedName: 'B',
            metatype: SysMLMetatype.Package,
            documentUri: 'file:///b.sysml',
            scopeId: createNodeId('root'),
            visibility: 'public',
        });

        expect(table.size).toBe(2);
        table.removeDocument('file:///a.sysml');
        expect(table.size).toBe(1);
        expect(table.lookupQualified('A')).toBeUndefined();
        expect(table.lookupQualified('B')).toBeDefined();
    });
});
