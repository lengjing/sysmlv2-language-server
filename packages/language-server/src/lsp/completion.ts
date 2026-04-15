/**
 * @sysml/language-server - Completion Service
 *
 * Provides code completion for SysML v2.
 */

import type { DocumentUri, Position } from '@sysml/protocol';
import { SysMLMetatype } from '@sysml/protocol';
import type { SemanticModel } from '@sysml/semantics';
import type { DocumentManager } from '../document-manager.js';

export interface CompletionItem {
    label: string;
    kind: 'keyword' | 'snippet' | 'reference' | 'property';
    detail?: string;
    documentation?: string;
    insertText: string;
    insertTextFormat?: 'plainText' | 'snippet';
    sortText?: string;
}

/** Snippet templates for common SysML patterns */
const SNIPPETS: CompletionItem[] = [
    {
        label: 'package',
        kind: 'snippet',
        detail: 'Package definition',
        documentation: 'Creates a new SysML package.',
        insertText: 'package ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_package',
    },
    {
        label: 'part def',
        kind: 'snippet',
        detail: 'Part definition',
        documentation: 'Defines a reusable part type.',
        insertText: 'part def ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_part_def',
    },
    {
        label: 'part',
        kind: 'snippet',
        detail: 'Part usage',
        documentation: 'Creates an instance of a part definition.',
        insertText: 'part ${1:name} : ${2:Type};',
        insertTextFormat: 'snippet',
        sortText: '0_part',
    },
    {
        label: 'attribute def',
        kind: 'snippet',
        detail: 'Attribute definition',
        documentation: 'Defines a reusable attribute type.',
        insertText: 'attribute def ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_attr_def',
    },
    {
        label: 'attribute',
        kind: 'snippet',
        detail: 'Attribute usage',
        documentation: 'Adds an attribute.',
        insertText: 'attribute ${1:name} : ${2:Type};',
        insertTextFormat: 'snippet',
        sortText: '0_attr',
    },
    {
        label: 'port def',
        kind: 'snippet',
        detail: 'Port definition',
        documentation: 'Defines a port type for connections.',
        insertText: 'port def ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_port_def',
    },
    {
        label: 'port',
        kind: 'snippet',
        detail: 'Port usage',
        documentation: 'Adds a port.',
        insertText: 'port ${1:name} : ${2:PortType};',
        insertTextFormat: 'snippet',
        sortText: '0_port',
    },
    {
        label: 'action def',
        kind: 'snippet',
        detail: 'Action definition',
        documentation: 'Defines an action (behavior).',
        insertText: 'action def ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_action_def',
    },
    {
        label: 'requirement def',
        kind: 'snippet',
        detail: 'Requirement definition',
        documentation: 'Defines a requirement.',
        insertText: 'requirement def ${1:Name} {\n\tdoc /* ${2:description} */\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_req_def',
    },
    {
        label: 'state def',
        kind: 'snippet',
        detail: 'State definition',
        documentation: 'Defines a state machine.',
        insertText: 'state def ${1:Name} {\n\t$0\n}',
        insertTextFormat: 'snippet',
        sortText: '0_state_def',
    },
    {
        label: 'connection def',
        kind: 'snippet',
        detail: 'Connection definition',
        documentation: 'Defines a connection type.',
        insertText: 'connection def ${1:Name} {\n\tend ${2:source};\n\tend ${3:target};\n}',
        insertTextFormat: 'snippet',
        sortText: '0_conn_def',
    },
    {
        label: 'import',
        kind: 'snippet',
        detail: 'Import statement',
        documentation: 'Imports elements from another namespace.',
        insertText: 'import ${1:QualifiedName}::*;',
        insertTextFormat: 'snippet',
        sortText: '0_import',
    },
    {
        label: 'doc',
        kind: 'snippet',
        detail: 'Documentation',
        documentation: 'Adds documentation.',
        insertText: 'doc /* ${1:documentation} */',
        insertTextFormat: 'snippet',
        sortText: '0_doc',
    },
];

/**
 * Provides code completion items.
 */
export class CompletionService {
    private readonly semanticModel: SemanticModel;
    private readonly documentManager: DocumentManager;

    constructor(semanticModel: SemanticModel, documentManager: DocumentManager) {
        this.semanticModel = semanticModel;
        this.documentManager = documentManager;
    }

    /**
     * Get completions at a position.
     */
    getCompletions(uri: DocumentUri, position: Position): CompletionItem[] {
        const items: CompletionItem[] = [];

        // Add snippet completions
        items.push(...SNIPPETS);

        // Add symbol completions from the semantic model
        const doc = this.semanticModel.getDocument(uri);
        if (doc) {
            const rootId = doc.root.id;
            const scope = this.semanticModel.scopeResolver.getScopeFor(rootId, doc);
            const visible = scope.allVisible();

            for (const symbol of visible) {
                items.push({
                    label: symbol.name,
                    kind: 'reference',
                    detail: `${symbol.metatype}`,
                    documentation: `Qualified: ${symbol.qualifiedName}`,
                    insertText: symbol.name,
                    sortText: `1_${symbol.name}`,
                });
            }
        }

        return items;
    }
}
