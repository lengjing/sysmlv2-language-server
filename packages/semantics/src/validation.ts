/**
 * @sysml/semantics - Validation Rules Engine
 *
 * Extensible, rule-based validation system.
 * Rules can be registered via the plugin system or programmatically.
 */

import type { NodeId, Diagnostic, DiagnosticSeverity, Range, DocumentUri } from '@sysml/protocol';
import type { AstNode, DocumentAst } from '@sysml/ast';

/** A validation rule */
export interface ValidationRule {
    /** Unique rule ID (e.g., "SYS-001") */
    readonly id: string;
    /** Human-readable description */
    readonly description: string;
    /** The AST node type(s) this rule applies to */
    readonly appliesTo: readonly string[];
    /** Severity of violations */
    readonly severity: DiagnosticSeverity;
    /** The validation function */
    validate(node: AstNode, context: ValidationContext): ValidationIssue[];
}

/** Context provided to validation rules */
export interface ValidationContext {
    /** The document being validated */
    readonly document: DocumentAst;
    /** Resolve a symbol by name */
    resolveSymbol(name: string, fromNodeId: NodeId): import('./symbol-table.js').SymbolEntry | undefined;
    /** Check type conformance */
    conformsTo(subTypeId: NodeId, superTypeId: NodeId): boolean;
    /** Get all visible symbols in a scope */
    getVisibleSymbols(scopeId: NodeId): readonly import('./symbol-table.js').SymbolEntry[];
}

/** A validation issue found by a rule */
export interface ValidationIssue {
    readonly ruleId: string;
    readonly message: string;
    readonly severity: DiagnosticSeverity;
    readonly nodeId: NodeId;
    readonly range?: Range;
}

/**
 * Validation Registry - manages validation rules.
 */
export class ValidationRegistry {
    private readonly rules = new Map<string, ValidationRule>();
    private readonly disabledRules = new Set<string>();

    /**
     * Register a validation rule.
     */
    register(rule: ValidationRule): void {
        this.rules.set(rule.id, rule);
    }

    /**
     * Register multiple rules.
     */
    registerAll(rules: readonly ValidationRule[]): void {
        for (const rule of rules) {
            this.register(rule);
        }
    }

    /**
     * Disable a rule by ID.
     */
    disable(ruleId: string): void {
        this.disabledRules.add(ruleId);
    }

    /**
     * Enable a previously disabled rule.
     */
    enable(ruleId: string): void {
        this.disabledRules.delete(ruleId);
    }

    /**
     * Get all active rules for a given node type.
     */
    getRulesFor(nodeType: string): readonly ValidationRule[] {
        const result: ValidationRule[] = [];
        for (const rule of this.rules.values()) {
            if (this.disabledRules.has(rule.id)) continue;
            if (rule.appliesTo.includes(nodeType) || rule.appliesTo.includes('*')) {
                result.push(rule);
            }
        }
        return result;
    }

    /**
     * Get all registered rules.
     */
    getAllRules(): readonly ValidationRule[] {
        return [...this.rules.values()];
    }

    /**
     * Get a rule by ID.
     */
    getRule(id: string): ValidationRule | undefined {
        return this.rules.get(id);
    }
}

/**
 * Validation Engine - runs validation rules against a document.
 */
export class ValidationEngine {
    private readonly registry: ValidationRegistry;

    constructor(registry: ValidationRegistry) {
        this.registry = registry;
    }

    /**
     * Validate a document.
     * Returns all diagnostics found.
     */
    validate(document: DocumentAst, context: ValidationContext): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];

        for (const node of document.nodes.values()) {
            const rules = this.registry.getRulesFor(node.type);

            for (const rule of rules) {
                try {
                    const issues = rule.validate(node, context);
                    for (const issue of issues) {
                        diagnostics.push(this.issueToDiagnostic(issue, document.uri));
                    }
                } catch (error) {
                    // Don't let a single rule failure break validation
                    diagnostics.push({
                        range: node.range ?? { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                        severity: 3, // Information
                        code: `internal:${rule.id}`,
                        source: 'sysml',
                        message: `Validation rule '${rule.id}' threw an error: ${error instanceof Error ? error.message : String(error)}`,
                    });
                }
            }
        }

        return diagnostics;
    }

    private issueToDiagnostic(issue: ValidationIssue, _uri: DocumentUri): Diagnostic {
        return {
            range: issue.range ?? { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
            severity: issue.severity,
            code: issue.ruleId,
            source: 'sysml',
            message: issue.message,
        };
    }
}
