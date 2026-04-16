import { describe, it, expect } from 'vitest';
import { ValidationRegistry, ValidationEngine, type ValidationRule, type ValidationContext } from '../validation.js';
import { DiagnosticSeverity, SysMLMetatype, createNodeId } from '@sysml/protocol';
import { DocumentAstBuilder } from '@sysml/ast';

describe('ValidationRegistry', () => {
    it('should register and retrieve rules', () => {
        const registry = new ValidationRegistry();
        const rule: ValidationRule = {
            id: 'TEST-001',
            description: 'Test rule',
            appliesTo: [SysMLMetatype.Package],
            severity: DiagnosticSeverity.Error,
            validate: () => [],
        };

        registry.register(rule);
        const rules = registry.getRulesFor(SysMLMetatype.Package);
        expect(rules).toHaveLength(1);
        expect(rules[0].id).toBe('TEST-001');
    });

    it('should disable rules', () => {
        const registry = new ValidationRegistry();
        const rule: ValidationRule = {
            id: 'TEST-002',
            description: 'Disabled rule',
            appliesTo: [SysMLMetatype.Package],
            severity: DiagnosticSeverity.Warning,
            validate: () => [],
        };

        registry.register(rule);
        registry.disable('TEST-002');
        
        const rules = registry.getRulesFor(SysMLMetatype.Package);
        expect(rules).toHaveLength(0);
    });

    it('should support wildcard rules', () => {
        const registry = new ValidationRegistry();
        const rule: ValidationRule = {
            id: 'TEST-003',
            description: 'Wildcard rule',
            appliesTo: ['*'],
            severity: DiagnosticSeverity.Information,
            validate: () => [],
        };

        registry.register(rule);
        expect(registry.getRulesFor(SysMLMetatype.PartDefinition)).toHaveLength(1);
        expect(registry.getRulesFor(SysMLMetatype.Package)).toHaveLength(1);
    });
});

describe('ValidationEngine', () => {
    it('should run rules and collect diagnostics', () => {
        const registry = new ValidationRegistry();
        registry.register({
            id: 'TEST-FAIL',
            description: 'Always fails',
            appliesTo: [SysMLMetatype.Package],
            severity: DiagnosticSeverity.Error,
            validate: (node) => [{
                ruleId: 'TEST-FAIL',
                message: 'This always fails',
                severity: DiagnosticSeverity.Error,
                nodeId: node.id,
            }],
        });

        const engine = new ValidationEngine(registry);
        const builder = new DocumentAstBuilder('file:///test.sysml');
        const root = builder.createRootNamespace();
        builder.createPackage(root.id, 'TestPkg', 0);
        const doc = builder.build();

        const context: ValidationContext = {
            document: doc,
            resolveSymbol: () => undefined,
            conformsTo: () => false,
            getVisibleSymbols: () => [],
        };

        const diagnostics = engine.validate(doc, context);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].code).toBe('TEST-FAIL');
    });

    it('should handle rule errors gracefully', () => {
        const registry = new ValidationRegistry();
        registry.register({
            id: 'TEST-CRASH',
            description: 'Crashes',
            appliesTo: ['*'],
            severity: DiagnosticSeverity.Error,
            validate: () => { throw new Error('boom'); },
        });

        const engine = new ValidationEngine(registry);
        const builder = new DocumentAstBuilder('file:///test.sysml');
        builder.createRootNamespace();
        const doc = builder.build();

        const context: ValidationContext = {
            document: doc,
            resolveSymbol: () => undefined,
            conformsTo: () => false,
            getVisibleSymbols: () => [],
        };

        // Should not throw
        const diagnostics = engine.validate(doc, context);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0].message).toContain('boom');
    });
});
