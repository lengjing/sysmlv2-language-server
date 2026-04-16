import { describe, it, expect } from 'vitest';
import { DocumentAstBuilder } from '../builder.js';
import { SysMLMetatype, Visibility } from '@sysml/protocol';

describe('DocumentAstBuilder', () => {
    it('should build a document with root namespace', () => {
        const builder = new DocumentAstBuilder('file:///test.sysml');
        builder.createRootNamespace('TestRoot');
        const doc = builder.build();

        expect(doc.uri).toBe('file:///test.sysml');
        expect(doc.root.declaredName).toBe('TestRoot');
        expect(doc.root.type).toBe(SysMLMetatype.Namespace);
        expect(doc.errors).toHaveLength(0);
    });

    it('should create nested packages', () => {
        const builder = new DocumentAstBuilder('file:///test.sysml');
        const root = builder.createRootNamespace();
        const pkg = builder.createPackage(root.id, 'MyPackage', 0);

        const doc = builder.build();

        expect(doc.nodes.size).toBe(2);
        expect(pkg.declaredName).toBe('MyPackage');
        expect(pkg.parent).toBe(root.id);
        expect(root.children).toContain(pkg.id);
    });

    it('should create definitions and usages', () => {
        const builder = new DocumentAstBuilder('file:///test.sysml');
        const root = builder.createRootNamespace();

        const partDef = builder.createDefinition(
            root.id,
            SysMLMetatype.PartDefinition,
            'Vehicle',
            0,
            { isAbstract: true }
        );

        const partUsage = builder.createUsage(
            partDef.id,
            SysMLMetatype.PartUsage,
            'engine',
            0,
            { typings: [{ targetName: 'Engine' }] }
        );

        const doc = builder.build();

        expect(doc.nodes.size).toBe(3);
        expect(partDef.isAbstract).toBe(true);
        expect(partDef.declaredName).toBe('Vehicle');
        expect(partUsage.declaredName).toBe('engine');
        expect(partUsage.parent).toBe(partDef.id);
    });

    it('should throw if root not created before build', () => {
        const builder = new DocumentAstBuilder('file:///test.sysml');
        expect(() => builder.build()).toThrow('Root namespace not created');
    });
});
