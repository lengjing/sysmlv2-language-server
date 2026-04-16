/**
 * WebSocket LSP Client
 *
 * Connects to a Language Server via WebSocket.
 * Implements the LSP client protocol for browser use.
 */

/**
 * WebSocket-based LSP client for browser environments.
 */
export class WebSocketLSPClient {
    private socket: WebSocket | undefined;
    private readonly url: string;
    private messageId = 0;
    private readonly pendingRequests = new Map<number, {
        resolve: (result: unknown) => void;
        reject: (error: Error) => void;
    }>();

    constructor(url: string) {
        this.url = url;
    }

    /**
     * Connect to the LSP server.
     */
    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(this.url);

            this.socket.onopen = () => {
                console.log('[LSP] Connected to', this.url);
                this.sendInitialize();
                resolve();
            };

            this.socket.onmessage = (event: MessageEvent) => {
                this.handleMessage(String(event.data));
            };

            this.socket.onerror = (event: Event) => {
                console.error('[LSP] WebSocket error', event);
                reject(new Error('WebSocket connection failed'));
            };

            this.socket.onclose = () => {
                console.log('[LSP] Disconnected');
            };
        });
    }

    /**
     * Disconnect from the server.
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
        this.pendingRequests.clear();
    }

    /**
     * Send a didChange notification.
     */
    notifyDidChange(uri: string, content: string, version: number): void {
        this.sendNotification('textDocument/didChange', {
            textDocument: { uri, version },
            contentChanges: [{ text: content }],
        });
    }

    /**
     * Send a didOpen notification.
     */
    notifyDidOpen(uri: string, languageId: string, version: number, text: string): void {
        this.sendNotification('textDocument/didOpen', {
            textDocument: { uri, languageId, version, text },
        });
    }

    /**
     * Request completions.
     */
    async requestCompletion(uri: string, line: number, character: number): Promise<unknown> {
        return this.sendRequest('textDocument/completion', {
            textDocument: { uri },
            position: { line, character },
        });
    }

    /**
     * Request hover.
     */
    async requestHover(uri: string, line: number, character: number): Promise<unknown> {
        return this.sendRequest('textDocument/hover', {
            textDocument: { uri },
            position: { line, character },
        });
    }

    // --- Private ---

    private sendInitialize(): void {
        this.sendRequest('initialize', {
            processId: null,
            capabilities: {
                textDocument: {
                    completion: { completionItem: { snippetSupport: true } },
                    hover: {},
                    definition: {},
                    references: {},
                    documentSymbol: {},
                },
            },
            rootUri: null,
        }).then(() => {
            this.sendNotification('initialized', {});
        });
    }

    private async sendRequest(method: string, params: unknown): Promise<unknown> {
        const id = ++this.messageId;
        const message = JSON.stringify({
            jsonrpc: '2.0',
            id,
            method,
            params,
        });

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.socket?.send(message);
        });
    }

    private sendNotification(method: string, params: unknown): void {
        const message = JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
        });
        this.socket?.send(message);
    }

    private handleMessage(data: string): void {
        try {
            const message = JSON.parse(data);

            if (message.id !== undefined && this.pendingRequests.has(message.id)) {
                const pending = this.pendingRequests.get(message.id)!;
                this.pendingRequests.delete(message.id);

                if (message.error) {
                    pending.reject(new Error(message.error.message));
                } else {
                    pending.resolve(message.result);
                }
            } else if (message.method) {
                // Handle server-initiated notifications (diagnostics, etc.)
                this.handleNotification(message.method, message.params);
            }
        } catch (error) {
            console.error('[LSP] Failed to parse message:', error);
        }
    }

    private handleNotification(method: string, params: unknown): void {
        switch (method) {
            case 'textDocument/publishDiagnostics':
                console.log('[LSP] Diagnostics received:', params);
                break;
            default:
                console.log('[LSP] Notification:', method);
        }
    }
}
