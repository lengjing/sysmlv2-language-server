/**
 * @sysml/protocol - Capability Definitions
 *
 * Describes what features the server supports.
 */

export interface ServerCapabilities {
    readonly completionProvider: boolean;
    readonly hoverProvider: boolean;
    readonly definitionProvider: boolean;
    readonly referencesProvider: boolean;
    readonly documentSymbolProvider: boolean;
    readonly diagnosticProvider: boolean;
    readonly documentFormattingProvider: boolean;
    readonly codeActionProvider: boolean;
    readonly semanticTokensProvider: boolean;
}

export const DEFAULT_SERVER_CAPABILITIES: ServerCapabilities = {
    completionProvider: true,
    hoverProvider: true,
    definitionProvider: true,
    referencesProvider: true,
    documentSymbolProvider: true,
    diagnosticProvider: true,
    documentFormattingProvider: false,
    codeActionProvider: false,
    semanticTokensProvider: false,
};
