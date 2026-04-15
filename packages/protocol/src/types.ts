/**
 * @sysml/protocol - Core Type Definitions
 *
 * Shared types used across the entire SysML v2 toolchain.
 */

/** Stable unique identifier for AST nodes */
export type NodeId = string & { readonly __brand: 'NodeId' };

/** Document URI identifier */
export type DocumentUri = string;

/** Position in a document */
export interface Position {
    readonly line: number;
    readonly character: number;
}

/** Range in a document */
export interface Range {
    readonly start: Position;
    readonly end: Position;
}

/** Location in a document */
export interface Location {
    readonly uri: DocumentUri;
    readonly range: Range;
}

/** Diagnostic severity levels */
export enum DiagnosticSeverity {
    Error = 1,
    Warning = 2,
    Information = 3,
    Hint = 4,
}

/** A diagnostic message */
export interface Diagnostic {
    readonly range: Range;
    readonly severity: DiagnosticSeverity;
    readonly code?: string;
    readonly source?: string;
    readonly message: string;
    readonly relatedInformation?: DiagnosticRelatedInformation[];
}

export interface DiagnosticRelatedInformation {
    readonly location: Location;
    readonly message: string;
}

/** SysML element metatypes */
export enum SysMLMetatype {
    // KerML Core
    Element = 'Element',
    Namespace = 'Namespace',
    Package = 'Package',
    LibraryPackage = 'LibraryPackage',
    Type = 'Type',
    Class = 'Class',
    Classifier = 'Classifier',
    DataType = 'DataType',
    Structure = 'Structure',
    Feature = 'Feature',
    Association = 'Association',
    Connector = 'Connector',
    Behavior = 'Behavior',
    Function = 'Function',
    Predicate = 'Predicate',
    Step = 'Step',
    Expression = 'Expression',

    // KerML Relationships
    Membership = 'Membership',
    OwningMembership = 'OwningMembership',
    FeatureMembership = 'FeatureMembership',
    Specialization = 'Specialization',
    Subclassification = 'Subclassification',
    Subsetting = 'Subsetting',
    Redefinition = 'Redefinition',
    FeatureTyping = 'FeatureTyping',
    Conjugation = 'Conjugation',
    Import = 'Import',

    // SysML Definitions
    PartDefinition = 'PartDefinition',
    AttributeDefinition = 'AttributeDefinition',
    ItemDefinition = 'ItemDefinition',
    PortDefinition = 'PortDefinition',
    ConnectionDefinition = 'ConnectionDefinition',
    InterfaceDefinition = 'InterfaceDefinition',
    FlowDefinition = 'FlowDefinition',
    ActionDefinition = 'ActionDefinition',
    StateDefinition = 'StateDefinition',
    CalculationDefinition = 'CalculationDefinition',
    ConstraintDefinition = 'ConstraintDefinition',
    RequirementDefinition = 'RequirementDefinition',
    CaseDefinition = 'CaseDefinition',
    UseCaseDefinition = 'UseCaseDefinition',
    VerificationCaseDefinition = 'VerificationCaseDefinition',
    AnalysisCaseDefinition = 'AnalysisCaseDefinition',
    ViewDefinition = 'ViewDefinition',
    ViewpointDefinition = 'ViewpointDefinition',
    RenderingDefinition = 'RenderingDefinition',
    MetadataDefinition = 'MetadataDefinition',
    AllocationDefinition = 'AllocationDefinition',
    EnumerationDefinition = 'EnumerationDefinition',
    OccurrenceDefinition = 'OccurrenceDefinition',
    ConjugatedPortDefinition = 'ConjugatedPortDefinition',

    // SysML Usages
    PartUsage = 'PartUsage',
    AttributeUsage = 'AttributeUsage',
    ItemUsage = 'ItemUsage',
    PortUsage = 'PortUsage',
    ConnectionUsage = 'ConnectionUsage',
    InterfaceUsage = 'InterfaceUsage',
    FlowUsage = 'FlowUsage',
    ActionUsage = 'ActionUsage',
    StateUsage = 'StateUsage',
    CalculationUsage = 'CalculationUsage',
    ConstraintUsage = 'ConstraintUsage',
    RequirementUsage = 'RequirementUsage',
    CaseUsage = 'CaseUsage',
    UseCaseUsage = 'UseCaseUsage',
    VerificationCaseUsage = 'VerificationCaseUsage',
    AnalysisCaseUsage = 'AnalysisCaseUsage',
    ViewUsage = 'ViewUsage',
    ViewpointUsage = 'ViewpointUsage',
    RenderingUsage = 'RenderingUsage',
    MetadataUsage = 'MetadataUsage',
    AllocationUsage = 'AllocationUsage',
    EnumerationUsage = 'EnumerationUsage',
    OccurrenceUsage = 'OccurrenceUsage',
    ReferenceUsage = 'ReferenceUsage',
    TransitionUsage = 'TransitionUsage',

    // Other
    Comment = 'Comment',
    Documentation = 'Documentation',
    Multiplicity = 'Multiplicity',
    MultiplicityRange = 'MultiplicityRange',
}

/** Relationship edge types in the semantic model */
export enum EdgeType {
    Specialization = 'specialization',
    Typing = 'typing',
    Subsetting = 'subsetting',
    Redefinition = 'redefinition',
    Conjugation = 'conjugation',
    FeatureMembership = 'featureMembership',
    Import = 'import',
    Satisfy = 'satisfy',
    Refine = 'refine',
    Derive = 'derive',
    Allocate = 'allocate',
}

/** Visibility modifiers */
export enum Visibility {
    Public = 'public',
    Private = 'private',
    Protected = 'protected',
}

/** Feature direction */
export enum FeatureDirection {
    In = 'in',
    Out = 'out',
    InOut = 'inout',
}

/** Create a NodeId from a string (branded type factory) */
export function createNodeId(id: string): NodeId {
    return id as NodeId;
}

/** Generate a unique NodeId */
let nodeIdCounter = 0;
export function generateNodeId(): NodeId {
    return createNodeId(`node_${Date.now()}_${++nodeIdCounter}`);
}
