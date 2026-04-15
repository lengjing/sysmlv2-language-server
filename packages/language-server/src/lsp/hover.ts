/**
 * @sysml/language-server - Hover Service
 *
 * Provides hover information for SysML elements.
 */

import type { DocumentUri, Position } from '@sysml/protocol';
import type { SemanticModel } from '@sysml/semantics';
import type { DocumentManager } from '../document-manager.js';
import { isNamedElement, type AstNode } from '@sysml/ast';

export interface HoverResult {
    contents: string;
    range?: import('@sysml/protocol').Range;
}

/**
 * Provides hover information.
 */
export class HoverService {
    private readonly semanticModel: SemanticModel;
    private readonly documentManager: DocumentManager;

    constructor(semanticModel: SemanticModel, documentManager: DocumentManager) {
        this.semanticModel = semanticModel;
        this.documentManager = documentManager;
    }

    /**
     * Get hover information at a position.
     */
    getHover(uri: DocumentUri, _position: Position): HoverResult | undefined {
        const doc = this.semanticModel.getDocument(uri);
        if (!doc) return undefined;

        // In a full implementation, we'd find the node at the position
        // using the CST node mapping. For now, provide document-level info.
        const root = doc.root;
        if (!root) return undefined;

        const lines: string[] = [];

        if (isNamedElement(root) && root.declaredName) {
            lines.push(`**${root.declaredName}**`);
            lines.push('');
        }

        lines.push(`*Type:* ${root.type}`);

        const childCount = root.children.length;
        if (childCount > 0) {
            lines.push(`*Members:* ${childCount}`);
        }

        return {
            contents: lines.join('\n'),
        };
    }

    /**
     * Format hover content for a specific AST node.
     */
    formatNodeHover(node: AstNode): string {
        const lines: string[] = [];

        if (isNamedElement(node)) {
            if (node.declaredName) {
                lines.push(`**${node.declaredName}**`);
            }
            if (node.qualifiedName) {
                lines.push(`*Qualified:* ${node.qualifiedName}`);
            }
        }

        lines.push(`*Type:* ${node.type}`);

        // Show additional info
        const info: string[] = [];
        if ('isAbstract' in node && (node as any).isAbstract) info.push('abstract');
        if ('isVariation' in node && (node as any).isVariation) info.push('variation');
        if ('visibility' in node) info.push(String((node as any).visibility));
        
        if (info.length > 0) {
            lines.push(`*Modifiers:* ${info.join(', ')}`);
        }

        return lines.join('\n');
    }
}
