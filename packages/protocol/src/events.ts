/**
 * @sysml/protocol - Event Types
 *
 * Events emitted across the system pipeline.
 */

import type { DocumentUri, Diagnostic, NodeId, Range } from './types.js';

/** Document lifecycle events */
export interface DocumentOpenEvent {
    readonly uri: DocumentUri;
    readonly languageId: string;
    readonly version: number;
    readonly text: string;
}

export interface DocumentChangeEvent {
    readonly uri: DocumentUri;
    readonly version: number;
    readonly changes: readonly TextChange[];
}

export interface TextChange {
    readonly range: Range;
    readonly text: string;
}

export interface DocumentCloseEvent {
    readonly uri: DocumentUri;
}

/** Diagnostic events */
export interface DiagnosticsEvent {
    readonly uri: DocumentUri;
    readonly version: number;
    readonly diagnostics: readonly Diagnostic[];
}

/** Semantic events */
export interface SymbolResolvedEvent {
    readonly uri: DocumentUri;
    readonly nodeId: NodeId;
    readonly qualifiedName: string;
}

export interface ScopeChangedEvent {
    readonly uri: DocumentUri;
    readonly affectedScopes: readonly NodeId[];
}
