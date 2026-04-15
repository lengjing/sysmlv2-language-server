/**
 * @sysml/language-server - SysML v2 Language Server
 *
 * Clean LSP server implementation for SysML v2.
 * Pipeline: Text → Parser → AST → Semantic Model → Validation → LSP Output
 */

export { SysMLLanguageServer, type ServerOptions } from './server.js';
export { DocumentManager } from './document-manager.js';
export { DiagnosticService } from './diagnostics.js';
export { CompletionService } from './lsp/completion.js';
export { HoverService } from './lsp/hover.js';
export { DefinitionService } from './lsp/definition.js';
export { ReferencesService } from './lsp/references.js';
export { DocumentSymbolService } from './lsp/document-symbols.js';
