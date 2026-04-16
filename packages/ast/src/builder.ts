/**
 * @sysml/ast - AST Builder
 *
 * Fluent API for constructing AST nodes programmatically.
 * Used by the parser adapter and tests.
 */

import { SysMLMetatype, Visibility, type NodeId, type DocumentUri } from '@sysml/protocol';
import type {
    AstNode, NamespaceNode, DefinitionNode, UsageNode,
    FeatureNode, AnnotationNode, DocumentAst, ImportInfo,
    SpecializationInfo, TypingInfo, MultiplicityInfo
} from './nodes.js';
import { NodeIdMap } from './identity.js';

/**
 * Builder for constructing a DocumentAst.
 */
export class DocumentAstBuilder {
    private readonly uri: DocumentUri;
    private readonly nodes = new Map<NodeId, AstNode>();
    private readonly idMap = new NodeIdMap();
    private rootId?: NodeId;
    private version = 0;

    constructor(uri: DocumentUri) {
        this.uri = uri;
    }

    /** Set the document version */
    setVersion(version: number): this {
        this.version = version;
        return this;
    }

    /** Create and set the root namespace */
    createRootNamespace(name?: string): NamespaceNode {
        const id = this.idMap.register(undefined, SysMLMetatype.Namespace, name, 0);
        const node: NamespaceNode = {
            id,
            type: SysMLMetatype.Namespace,
            documentUri: this.uri,
            children: [],
            ownedMembers: [],
            imports: [],
            declaredName: name,
            visibility: Visibility.Public,
        };
        this.rootId = id;
        this.nodes.set(id, node);
        return node;
    }

    /** Create a package node */
    createPackage(
        parentId: NodeId,
        name: string,
        index: number,
        options?: { isLibrary?: boolean; shortName?: string }
    ): NamespaceNode {
        const type = options?.isLibrary ? SysMLMetatype.LibraryPackage : SysMLMetatype.Package;
        const id = this.idMap.register(parentId, type, name, index);
        const node: NamespaceNode = {
            id,
            type,
            documentUri: this.uri,
            parent: parentId,
            children: [],
            ownedMembers: [],
            imports: [],
            declaredName: name,
            declaredShortName: options?.shortName,
            visibility: Visibility.Public,
        };
        this.addChild(parentId, id);
        this.nodes.set(id, node);
        return node;
    }

    /** Create a definition node */
    createDefinition(
        parentId: NodeId,
        type: SysMLMetatype,
        name: string,
        index: number,
        options?: {
            isAbstract?: boolean;
            isVariation?: boolean;
            specializations?: SpecializationInfo[];
            shortName?: string;
        }
    ): DefinitionNode {
        const id = this.idMap.register(parentId, type, name, index);
        const node: DefinitionNode = {
            id,
            type,
            documentUri: this.uri,
            parent: parentId,
            children: [],
            declaredName: name,
            declaredShortName: options?.shortName,
            visibility: Visibility.Public,
            isAbstract: options?.isAbstract ?? false,
            isSufficient: false,
            ownedFeatures: [],
            specializations: options?.specializations ?? [],
            isVariation: options?.isVariation ?? false,
            isIndividual: false,
        };
        this.addChild(parentId, id);
        this.nodes.set(id, node);
        return node;
    }

    /** Create a usage node */
    createUsage(
        parentId: NodeId,
        type: SysMLMetatype,
        name: string,
        index: number,
        options?: {
            typings?: TypingInfo[];
            multiplicity?: MultiplicityInfo;
            isComposite?: boolean;
            defaultValue?: string;
            shortName?: string;
        }
    ): UsageNode {
        const id = this.idMap.register(parentId, type, name, index);
        const node: UsageNode = {
            id,
            type,
            documentUri: this.uri,
            parent: parentId,
            children: [],
            declaredName: name,
            declaredShortName: options?.shortName,
            visibility: Visibility.Public,
            isAbstract: false,
            isSufficient: false,
            ownedFeatures: [],
            specializations: [],
            typings: options?.typings ?? [],
            multiplicity: options?.multiplicity,
            isComposite: options?.isComposite ?? true,
            isPortion: false,
            isReadOnly: false,
            isDerived: false,
            isEnd: false,
            defaultValue: options?.defaultValue,
            isVariation: false,
            isIndividual: false,
            isReference: false,
        };
        this.addChild(parentId, id);
        this.nodes.set(id, node);
        return node;
    }

    /** Create an annotation node */
    createAnnotation(
        parentId: NodeId,
        type: SysMLMetatype.Comment | SysMLMetatype.Documentation,
        body: string,
        index: number,
        annotatedElements: NodeId[] = []
    ): AnnotationNode {
        const id = this.idMap.register(parentId, type, undefined, index);
        const node: AnnotationNode = {
            id,
            type,
            documentUri: this.uri,
            parent: parentId,
            children: [],
            body,
            annotatedElements,
        };
        this.addChild(parentId, id);
        this.nodes.set(id, node);
        return node;
    }

    /** Add an import to a namespace */
    addImport(namespaceId: NodeId, importInfo: ImportInfo): void {
        const ns = this.nodes.get(namespaceId);
        if (ns && 'imports' in ns) {
            (ns as NamespaceNode).imports.push(importInfo);
        }
    }

    /** Build the final DocumentAst */
    build(): DocumentAst {
        if (!this.rootId) {
            throw new Error('Root namespace not created. Call createRootNamespace() first.');
        }

        const root = this.nodes.get(this.rootId) as NamespaceNode;
        if (!root) {
            throw new Error('Root node not found in nodes map.');
        }

        return {
            uri: this.uri,
            root,
            nodes: new Map(this.nodes),
            errors: [],
            version: this.version,
        };
    }

    private addChild(parentId: NodeId, childId: NodeId): void {
        const parent = this.nodes.get(parentId);
        if (parent) {
            parent.children.push(childId);
            if ('ownedMembers' in parent) {
                (parent as NamespaceNode).ownedMembers.push(childId);
            }
            if ('ownedFeatures' in parent) {
                (parent as any).ownedFeatures.push(childId);
            }
        }
    }
}
