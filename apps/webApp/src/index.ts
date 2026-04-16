/**
 * SysML v2 Web Application
 *
 * Browser-based modeling tool using Monaco Editor.
 * Connects to the language server via WebSocket.
 */

export { WebApp, type WebAppConfig } from './app.js';
export { MonacoSetup } from './monaco-setup.js';
export { WebSocketLSPClient } from './lsp-client.js';
