/**
 * @sysml/semantics - Built-in Validation Rules
 *
 * Standard validation rules for SysML v2 specification compliance.
 */

import { DiagnosticSeverity, SysMLMetatype } from '@sysml/protocol';
import type { AstNode } from '@sysml/ast';
import { isNamedElement } from '@sysml/ast';
import type { ValidationRule, ValidationContext, ValidationIssue } from './validation.js';

/**
 * Rule: Namespace members must have distinguishable names.
 */
export const namespaceDistinguishability: ValidationRule = {
    id: 'SYS-001',
    description: 'Members of a namespace must have distinguishable names.',
    appliesTo: [SysMLMetatype.Namespace, SysMLMetatype.Package, SysMLMetatype.LibraryPackage],
    severity: DiagnosticSeverity.Error,
    validate(node: AstNode, context: ValidationContext): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        const names = new Map<string, AstNode[]>();

        // Collect all named children
        for (const childId of node.children) {
            const child = context.document.nodes.get(childId);
            if (child && isNamedElement(child) && child.declaredName) {
                const list = names.get(child.declaredName) ?? [];
                list.push(child);
                names.set(child.declaredName, list);
            }
        }

        // Report duplicates
        for (const [name, nodes] of names) {
            if (nodes.length > 1) {
                for (const dupNode of nodes) {
                    issues.push({
                        ruleId: 'SYS-001',
                        message: `Duplicate member name '${name}' in namespace.`,
                        severity: DiagnosticSeverity.Error,
                        nodeId: dupNode.id,
                        range: dupNode.range,
                    });
                }
            }
        }

        return issues;
    },
};

/**
 * Rule: Definition with variation must be abstract.
 */
export const definitionVariationIsAbstract: ValidationRule = {
    id: 'SYS-002',
    description: 'A definition with isVariation=true must be abstract.',
    appliesTo: [
        SysMLMetatype.PartDefinition,
        SysMLMetatype.ActionDefinition,
        SysMLMetatype.AttributeDefinition,
        SysMLMetatype.ItemDefinition,
    ],
    severity: DiagnosticSeverity.Error,
    validate(node: AstNode, _context: ValidationContext): ValidationIssue[] {
        const def = node as any;
        if (def.isVariation && !def.isAbstract) {
            return [{
                ruleId: 'SYS-002',
                message: 'A variation definition must be abstract.',
                severity: DiagnosticSeverity.Error,
                nodeId: node.id,
                range: node.range,
            }];
        }
        return [];
    },
};

/**
 * Rule: Port definitions cannot have composite usages.
 */
export const portDefinitionOwnedUsagesNotComposite: ValidationRule = {
    id: 'SYS-003',
    description: 'Port definition usages must not be composite.',
    appliesTo: [SysMLMetatype.PortDefinition],
    severity: DiagnosticSeverity.Error,
    validate(node: AstNode, context: ValidationContext): ValidationIssue[] {
        const issues: ValidationIssue[] = [];

        for (const childId of node.children) {
            const child = context.document.nodes.get(childId);
            if (child && 'isComposite' in child && (child as any).isComposite) {
                issues.push({
                    ruleId: 'SYS-003',
                    message: 'Usages in a PortDefinition must not be composite.',
                    severity: DiagnosticSeverity.Error,
                    nodeId: child.id,
                    range: child.range,
                });
            }
        }

        return issues;
    },
};

/**
 * Rule: Type must have at most one conjugator.
 */
export const typeAtMostOneConjugator: ValidationRule = {
    id: 'SYS-004',
    description: 'A type must have at most one conjugation.',
    appliesTo: ['*'],
    severity: DiagnosticSeverity.Error,
    validate(node: AstNode, _context: ValidationContext): ValidationIssue[] {
        const typeNode = node as any;
        if (!typeNode.specializations) return [];

        const conjugations = typeNode.specializations.filter(
            (s: any) => s.kind === 'conjugation'
        );

        if (conjugations.length > 1) {
            return [{
                ruleId: 'SYS-004',
                message: 'A type must have at most one conjugation.',
                severity: DiagnosticSeverity.Error,
                nodeId: node.id,
                range: node.range,
            }];
        }
        return [];
    },
};

/**
 * Rule: Feature typing must reference a valid type.
 */
export const featureHasType: ValidationRule = {
    id: 'SYS-005',
    description: 'A feature should have at least one typing.',
    appliesTo: [
        SysMLMetatype.PartUsage,
        SysMLMetatype.AttributeUsage,
        SysMLMetatype.PortUsage,
    ],
    severity: DiagnosticSeverity.Warning,
    validate(node: AstNode, _context: ValidationContext): ValidationIssue[] {
        const feature = node as any;
        if (feature.typings && feature.typings.length === 0 && !feature.isDerived) {
            return [{
                ruleId: 'SYS-005',
                message: 'Feature has no explicit typing. Consider adding a type reference.',
                severity: DiagnosticSeverity.Warning,
                nodeId: node.id,
                range: node.range,
            }];
        }
        return [];
    },
};

/**
 * Get all built-in validation rules.
 */
export function getBuiltinRules(): readonly ValidationRule[] {
    return [
        namespaceDistinguishability,
        definitionVariationIsAbstract,
        portDefinitionOwnedUsagesNotComposite,
        typeAtMostOneConjugator,
        featureHasType,
    ];
}
