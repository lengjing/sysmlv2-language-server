/**
 * @sysml/language-server - Diagnostic Service
 *
 * Computes diagnostics (syntax + semantic) for documents.
 */

import type { DocumentUri, Diagnostic, ValidationConfig } from '@sysml/protocol';
import { DiagnosticSeverity } from '@sysml/protocol';
import type { SemanticModel } from '@sysml/semantics';
import type { Logger } from '@sysml/utils';

/**
 * Computes and filters diagnostics for documents.
 */
export class DiagnosticService {
    private readonly semanticModel: SemanticModel;
    private readonly config: ValidationConfig;
    private readonly logger: Logger;

    constructor(semanticModel: SemanticModel, config: ValidationConfig, logger: Logger) {
        this.semanticModel = semanticModel;
        this.config = config;
        this.logger = logger.child('diagnostics');
    }

    /**
     * Compute diagnostics for a document.
     */
    computeDiagnostics(uri: DocumentUri, isStdlib: boolean = false): Diagnostic[] {
        // Don't validate stdlib unless explicitly configured
        if (isStdlib && !this.config.validateStdlib) {
            return [];
        }

        if (!this.config.enabled) {
            return [];
        }

        const doc = this.semanticModel.getDocument(uri);
        if (!doc) return [];

        const diagnostics: Diagnostic[] = [];

        // Add parse errors
        for (const error of doc.errors) {
            diagnostics.push({
                range: error.range,
                severity: DiagnosticSeverity.Error,
                source: 'sysml-parser',
                message: error.message,
            });
        }

        // Add semantic validation diagnostics
        try {
            const validationDiags = this.semanticModel.validateDocument(uri);
            diagnostics.push(...validationDiags);
        } catch (error) {
            this.logger.error(`Validation error for ${uri}`, error);
        }

        // Filter disabled rules
        const filtered = diagnostics.filter(d => {
            if (d.code && this.config.disabledRules.includes(String(d.code))) {
                return false;
            }
            return true;
        });

        // Limit diagnostics
        if (filtered.length > this.config.maxDiagnostics) {
            return filtered.slice(0, this.config.maxDiagnostics);
        }

        return filtered;
    }
}
