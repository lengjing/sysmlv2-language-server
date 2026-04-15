/**
 * SysML v2 Web Application
 *
 * Main application entry point. Sets up Monaco editor
 * and connects to the language server.
 */

import { MonacoSetup } from './monaco-setup.js';
import { WebSocketLSPClient } from './lsp-client.js';

export interface WebAppConfig {
    /** Container element ID for the editor */
    containerId: string;
    /** WebSocket URL for LSP connection */
    lspUrl?: string;
    /** Initial SysML content */
    initialContent?: string;
    /** Theme ('vs-dark' | 'vs' | 'hc-black') */
    theme?: string;
}

const DEFAULT_CONTENT = `// SysML v2 Model
package MySystem {
    part def Vehicle {
        attribute mass : Real;
        
        part engine : Engine;
        part wheels : Wheel[4];
    }
    
    part def Engine {
        attribute power : Real;
        attribute displacement : Real;
    }
    
    part def Wheel {
        attribute diameter : Real;
    }
}
`;

/**
 * SysML v2 Web Application.
 */
export class WebApp {
    private monacoSetup: MonacoSetup | undefined;
    private lspClient: WebSocketLSPClient | undefined;
    private readonly config: WebAppConfig;

    constructor(config: WebAppConfig) {
        this.config = config;
    }

    /**
     * Initialize the web application.
     */
    async initialize(): Promise<void> {
        // Set up Monaco editor
        this.monacoSetup = new MonacoSetup(
            this.config.containerId,
            this.config.initialContent ?? DEFAULT_CONTENT,
            this.config.theme ?? 'vs-dark'
        );
        await this.monacoSetup.initialize();

        // Connect to LSP server if URL provided
        if (this.config.lspUrl) {
            this.lspClient = new WebSocketLSPClient(this.config.lspUrl);
            await this.lspClient.connect();
            
            // Wire up editor changes to LSP
            this.monacoSetup.onContentChange((content, version) => {
                this.lspClient?.notifyDidChange('inmemory://model.sysml', content, version);
            });
        }
    }

    /**
     * Get the current editor content.
     */
    getContent(): string {
        return this.monacoSetup?.getContent() ?? '';
    }

    /**
     * Set the editor content.
     */
    setContent(content: string): void {
        this.monacoSetup?.setContent(content);
    }

    /**
     * Dispose all resources.
     */
    dispose(): void {
        this.lspClient?.disconnect();
        this.monacoSetup?.dispose();
    }
}
