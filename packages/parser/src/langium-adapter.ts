/**
 * @sysml/parser - Langium AST Adapter
 *
 * Converts Langium's generated AST nodes to our @sysml/ast types.
 * This is the bridge between the Langium parser and our clean AST.
 */

import { SysMLMetatype, Visibility, FeatureDirection, createNodeId, type NodeId, type DocumentUri, type Range } from '@sysml/protocol';
import { DocumentAstBuilder, type DocumentAst, type AstNode, type NamespaceNode, type ImportInfo, type SpecializationInfo, type TypingInfo, type MultiplicityInfo } from '@sysml/ast';

/**
 * Maps Langium AST node $type strings to our SysMLMetatype enum.
 */
const TYPE_MAP: Record<string, SysMLMetatype> = {
    'Namespace': SysMLMetatype.Namespace,
    'Package': SysMLMetatype.Package,
    'LibraryPackage': SysMLMetatype.LibraryPackage,
    'RootNamespace': SysMLMetatype.Namespace,
    'PartDefinition': SysMLMetatype.PartDefinition,
    'AttributeDefinition': SysMLMetatype.AttributeDefinition,
    'ItemDefinition': SysMLMetatype.ItemDefinition,
    'PortDefinition': SysMLMetatype.PortDefinition,
    'ConnectionDefinition': SysMLMetatype.ConnectionDefinition,
    'InterfaceDefinition': SysMLMetatype.InterfaceDefinition,
    'ActionDefinition': SysMLMetatype.ActionDefinition,
    'StateDefinition': SysMLMetatype.StateDefinition,
    'CalculationDefinition': SysMLMetatype.CalculationDefinition,
    'ConstraintDefinition': SysMLMetatype.ConstraintDefinition,
    'RequirementDefinition': SysMLMetatype.RequirementDefinition,
    'CaseDefinition': SysMLMetatype.CaseDefinition,
    'UseCaseDefinition': SysMLMetatype.UseCaseDefinition,
    'VerificationCaseDefinition': SysMLMetatype.VerificationCaseDefinition,
    'AnalysisCaseDefinition': SysMLMetatype.AnalysisCaseDefinition,
    'ViewDefinition': SysMLMetatype.ViewDefinition,
    'ViewpointDefinition': SysMLMetatype.ViewpointDefinition,
    'RenderingDefinition': SysMLMetatype.RenderingDefinition,
    'MetadataDefinition': SysMLMetatype.MetadataDefinition,
    'AllocationDefinition': SysMLMetatype.AllocationDefinition,
    'EnumerationDefinition': SysMLMetatype.EnumerationDefinition,
    'OccurrenceDefinition': SysMLMetatype.OccurrenceDefinition,
    'ConjugatedPortDefinition': SysMLMetatype.ConjugatedPortDefinition,
    'PartUsage': SysMLMetatype.PartUsage,
    'AttributeUsage': SysMLMetatype.AttributeUsage,
    'ItemUsage': SysMLMetatype.ItemUsage,
    'PortUsage': SysMLMetatype.PortUsage,
    'ConnectionUsage': SysMLMetatype.ConnectionUsage,
    'InterfaceUsage': SysMLMetatype.InterfaceUsage,
    'FlowUsage': SysMLMetatype.FlowUsage,
    'ActionUsage': SysMLMetatype.ActionUsage,
    'StateUsage': SysMLMetatype.StateUsage,
    'CalculationUsage': SysMLMetatype.CalculationUsage,
    'ConstraintUsage': SysMLMetatype.ConstraintUsage,
    'RequirementUsage': SysMLMetatype.RequirementUsage,
    'CaseUsage': SysMLMetatype.CaseUsage,
    'UseCaseUsage': SysMLMetatype.UseCaseUsage,
    'VerificationCaseUsage': SysMLMetatype.VerificationCaseUsage,
    'AnalysisCaseUsage': SysMLMetatype.AnalysisCaseUsage,
    'ViewUsage': SysMLMetatype.ViewUsage,
    'ViewpointUsage': SysMLMetatype.ViewpointUsage,
    'RenderingUsage': SysMLMetatype.RenderingUsage,
    'MetadataUsage': SysMLMetatype.MetadataUsage,
    'AllocationUsage': SysMLMetatype.AllocationUsage,
    'OccurrenceUsage': SysMLMetatype.OccurrenceUsage,
    'ReferenceUsage': SysMLMetatype.ReferenceUsage,
    'TransitionUsage': SysMLMetatype.TransitionUsage,
    'Comment': SysMLMetatype.Comment,
    'Documentation': SysMLMetatype.Documentation,
    'Membership': SysMLMetatype.Membership,
    'OwningMembership': SysMLMetatype.OwningMembership,
    'FeatureMembership': SysMLMetatype.FeatureMembership,
    'Type': SysMLMetatype.Type,
    'Class': SysMLMetatype.Class,
    'Classifier': SysMLMetatype.Classifier,
    'DataType': SysMLMetatype.DataType,
    'Structure': SysMLMetatype.Structure,
    'Feature': SysMLMetatype.Feature,
    'Association': SysMLMetatype.Association,
    'Connector': SysMLMetatype.Connector,
    'Behavior': SysMLMetatype.Behavior,
    'Function': SysMLMetatype.Function,
    'Predicate': SysMLMetatype.Predicate,
    'Step': SysMLMetatype.Step,
    'Expression': SysMLMetatype.Expression,
    'Multiplicity': SysMLMetatype.Multiplicity,
    'MultiplicityRange': SysMLMetatype.MultiplicityRange,
};

/** Interface for a generic Langium-style AST node */
interface LangiumAstNode {
    $type: string;
    $container?: LangiumAstNode;
    $cstNode?: {
        offset: number;
        length: number;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    [key: string]: unknown;
}

/**
 * Adapter that converts Langium AST to our clean AST format.
 */
export class LangiumAstAdapter {
    /**
     * Parse text and return a DocumentAst.
     *
     * In production, this would use the Langium parser services.
     * For now, it provides a framework that can be wired up to Langium.
     */
    parse(text: string, uri: DocumentUri, version: number): DocumentAst {
        const builder = new DocumentAstBuilder(uri);
        builder.setVersion(version);

        // Create root namespace
        const root = builder.createRootNamespace();

        // This is the integration point where the Langium parser would be called.
        // The actual Langium AST would be traversed and converted using convertNode().
        // For now, we return the empty document - the LSP server's Langium integration
        // will use this adapter to convert parsed documents.

        return builder.build();
    }

    /**
     * Convert a Langium AST node to our AST format.
     * Called by the LSP server after Langium parsing.
     */
    convertDocument(langiumRoot: LangiumAstNode, uri: DocumentUri, version: number): DocumentAst {
        const builder = new DocumentAstBuilder(uri);
        builder.setVersion(version);

        // Create root namespace
        const rootName = this.getLangiumNodeName(langiumRoot);
        const root = builder.createRootNamespace(rootName);

        // Recursively convert children
        this.convertChildren(langiumRoot, root.id, builder, 0);

        return builder.build();
    }

    /**
     * Dispose any resources.
     */
    dispose(): void {
        // Nothing to dispose in the adapter itself
    }

    // --- Private conversion methods ---

    private convertChildren(
        langiumNode: LangiumAstNode,
        parentId: NodeId,
        builder: DocumentAstBuilder,
        depth: number
    ): void {
        // Traverse ownedRelationship (primary SysML AST pattern)
        const relationships = langiumNode.ownedRelationship;
        if (Array.isArray(relationships)) {
            let index = 0;
            for (const rel of relationships) {
                const relNode = rel as LangiumAstNode;

                // Each relationship may contain ownedRelatedElement
                const elements = relNode.ownedRelatedElement;
                if (Array.isArray(elements)) {
                    for (const elem of elements) {
                        this.convertNode(elem as LangiumAstNode, parentId, builder, index++, depth + 1);
                    }
                } else if (elements && typeof elements === 'object') {
                    this.convertNode(elements as LangiumAstNode, parentId, builder, index++, depth + 1);
                }

                // Check ownedMemberElement
                const memberElem = relNode.ownedMemberElement;
                if (memberElem && typeof memberElem === 'object') {
                    this.convertNode(memberElem as LangiumAstNode, parentId, builder, index++, depth + 1);
                }
            }
        }

        // Check ownedMember (alternative pattern)
        const members = langiumNode.ownedMember;
        if (Array.isArray(members)) {
            let index = 0;
            for (const member of members) {
                this.convertNode(member as LangiumAstNode, parentId, builder, index++, depth + 1);
            }
        }
    }

    private convertNode(
        langiumNode: LangiumAstNode,
        parentId: NodeId,
        builder: DocumentAstBuilder,
        index: number,
        depth: number
    ): void {
        const metatype = this.mapType(langiumNode.$type);
        const name = this.getLangiumNodeName(langiumNode);

        if (!metatype) {
            // Skip unknown node types but still traverse children
            this.convertChildren(langiumNode, parentId, builder, depth);
            return;
        }

        // Determine what kind of node to create based on metatype
        if (this.isNamespaceMetatype(metatype)) {
            const ns = builder.createPackage(parentId, name ?? '', index, {
                isLibrary: metatype === SysMLMetatype.LibraryPackage,
                shortName: (langiumNode.declaredShortName as string) ?? undefined,
            });
            this.convertChildren(langiumNode, ns.id, builder, depth);
        } else if (this.isDefinitionMetatype(metatype)) {
            const def = builder.createDefinition(parentId, metatype, name ?? '', index, {
                isAbstract: (langiumNode.isAbstract as boolean) ?? false,
                isVariation: (langiumNode.isVariation as boolean) ?? false,
                shortName: (langiumNode.declaredShortName as string) ?? undefined,
            });
            this.convertChildren(langiumNode, def.id, builder, depth);
        } else if (this.isUsageMetatype(metatype)) {
            builder.createUsage(parentId, metatype, name ?? '', index, {
                isComposite: (langiumNode.isComposite as boolean) ?? true,
                shortName: (langiumNode.declaredShortName as string) ?? undefined,
            });
        } else if (metatype === SysMLMetatype.Comment || metatype === SysMLMetatype.Documentation) {
            builder.createAnnotation(parentId, metatype, (langiumNode.body as string) ?? '', index);
        }
        // Other node types are handled as generic children
    }

    private getLangiumNodeName(node: LangiumAstNode): string | undefined {
        return (node.declaredName as string) ?? (node.name as string) ?? (node.memberName as string) ?? undefined;
    }

    private mapType(langiumType: string): SysMLMetatype | undefined {
        return TYPE_MAP[langiumType];
    }

    private isNamespaceMetatype(type: SysMLMetatype): boolean {
        return type === SysMLMetatype.Package ||
               type === SysMLMetatype.LibraryPackage ||
               type === SysMLMetatype.Namespace;
    }

    private isDefinitionMetatype(type: SysMLMetatype): boolean {
        return type.toString().endsWith('Definition');
    }

    private isUsageMetatype(type: SysMLMetatype): boolean {
        return type.toString().endsWith('Usage');
    }
}
