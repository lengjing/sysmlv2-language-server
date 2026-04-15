/**
 * @sysml/ast - AST Node Definitions
 *
 * Defines the AST node types for SysML v2 / KerML.
 * Each node has a stable identity via NodeId.
 */

import type { NodeId, SysMLMetatype, Visibility, FeatureDirection, Range, DocumentUri } from '@sysml/protocol';

/** Base interface for all AST nodes */
export interface AstNode {
    /** Stable unique identifier, persists across incremental updates */
    readonly id: NodeId;
    /** The metatype of this node */
    readonly type: SysMLMetatype;
    /** Source location */
    range?: Range;
    /** Document this node belongs to */
    documentUri?: DocumentUri;
    /** Parent node ID */
    parent?: NodeId;
    /** Child node IDs (ordered) */
    children: NodeId[];
}

/** An element with a name */
export interface NamedElement extends AstNode {
    /** Declared name */
    declaredName?: string;
    /** Short name */
    declaredShortName?: string;
    /** Computed qualified name */
    qualifiedName?: string;
    /** Visibility */
    visibility?: Visibility;
}

/** Namespace - container for named elements */
export interface NamespaceNode extends NamedElement {
    type: SysMLMetatype.Namespace | SysMLMetatype.Package | SysMLMetatype.LibraryPackage;
    /** Owned member IDs */
    ownedMembers: NodeId[];
    /** Import references */
    imports: ImportInfo[];
}

export interface ImportInfo {
    /** Qualified name being imported */
    qualifiedName: string;
    /** Whether this is a wildcard import */
    isWildcard: boolean;
    /** Whether this is a recursive import */
    isRecursive: boolean;
    /** Visibility of the import */
    visibility: Visibility;
}

/** Type - base for classifiers and features */
export interface TypeNode extends NamedElement {
    /** Whether this type is abstract */
    isAbstract: boolean;
    /** Whether this type is sufficient */
    isSufficient: boolean;
    /** Owned features */
    ownedFeatures: NodeId[];
    /** Specialization targets (qualified names or node IDs) */
    specializations: SpecializationInfo[];
}

export interface SpecializationInfo {
    readonly kind: 'specialization' | 'subclassification' | 'conjugation';
    readonly targetName: string;
    readonly targetId?: NodeId;
}

/** Feature - typed structural element */
export interface FeatureNode extends TypeNode {
    /** Feature direction */
    direction?: FeatureDirection;
    /** Whether this is a composite feature */
    isComposite: boolean;
    /** Whether this is a portion */
    isPortion: boolean;
    /** Whether this is read-only */
    isReadOnly: boolean;
    /** Whether this is derived */
    isDerived: boolean;
    /** Whether this is an end feature */
    isEnd: boolean;
    /** Typing references */
    typings: TypingInfo[];
    /** Multiplicity */
    multiplicity?: MultiplicityInfo;
    /** Default value expression (textual) */
    defaultValue?: string;
}

export interface TypingInfo {
    readonly targetName: string;
    readonly targetId?: NodeId;
}

export interface MultiplicityInfo {
    readonly lower?: number | string;
    readonly upper?: number | string;
}

/** Definition node (PartDefinition, ActionDefinition, etc.) */
export interface DefinitionNode extends TypeNode {
    /** Whether this is a variation */
    isVariation: boolean;
    /** Whether this is individual */
    isIndividual: boolean;
}

/** Usage node (PartUsage, ActionUsage, etc.) */
export interface UsageNode extends FeatureNode {
    /** Whether this is a variation */
    isVariation: boolean;
    /** Whether this is individual */
    isIndividual: boolean;
    /** Whether this is a reference (not composition) */
    isReference: boolean;
}

/** Relationship node */
export interface RelationshipNode extends AstNode {
    /** Source element ID */
    sourceId: NodeId;
    /** Target element IDs */
    targetIds: NodeId[];
}

/** Comment or Documentation */
export interface AnnotationNode extends AstNode {
    type: SysMLMetatype.Comment | SysMLMetatype.Documentation;
    /** Comment body text */
    body: string;
    /** Annotated element IDs */
    annotatedElements: NodeId[];
}

/** A full document AST */
export interface DocumentAst {
    /** Document URI */
    readonly uri: DocumentUri;
    /** Root namespace node */
    readonly root: NamespaceNode;
    /** All nodes indexed by ID */
    readonly nodes: ReadonlyMap<NodeId, AstNode>;
    /** Parse errors */
    readonly errors: readonly ParseErrorInfo[];
    /** Document version (for incremental updates) */
    version: number;
}

export interface ParseErrorInfo {
    readonly message: string;
    readonly range: Range;
}
