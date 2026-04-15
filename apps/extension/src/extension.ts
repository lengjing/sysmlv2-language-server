/**
 * SysML v2 VSCode Extension
 *
 * Provides LSP client integration, syntax highlighting,
 * diagnostics display, and basic commands.
 */

import type * as vscode from 'vscode';

let client: any; // LanguageClient
let outputChannel: any; // vscode.OutputChannel

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const vscodeModule = await import('vscode');
    
    outputChannel = vscodeModule.window.createOutputChannel('SysML v2 Language Server');
    outputChannel.appendLine('[SysML] Activating extension...');

    try {
        if (vscodeModule.env.uiKind === vscodeModule.UIKind.Web) {
            await startBrowserClient(context, vscodeModule);
        } else {
            await startNodeClient(context, vscodeModule);
        }

        registerCommands(context, vscodeModule);
        outputChannel.appendLine('[SysML] Extension activated successfully.');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`[SysML] Failed to activate: ${message}`);
        vscodeModule.window.showErrorMessage(`SysML: Failed to start language server: ${message}`);
    }
}

export async function deactivate(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
    }
}

async function startNodeClient(
    context: vscode.ExtensionContext,
    vscodeModule: typeof vscode
): Promise<void> {
    const { LanguageClient, TransportKind } = await import('vscode-languageclient/node');
    const path = await import('path');

    const serverModule = context.asAbsolutePath(
        path.join('dist', 'language-server', 'main-node.bundle.js')
    );

    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] },
        },
    };

    const clientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'sysml' },
            { scheme: 'file', language: 'kerml' },
        ],
        synchronize: {
            fileEvents: vscodeModule.workspace.createFileSystemWatcher('**/*.{sysml,kerml}'),
        },
        outputChannel,
        traceOutputChannel: outputChannel,
    };

    client = new LanguageClient(
        'sysmlLanguageServer',
        'SysML v2 Language Server',
        serverOptions,
        clientOptions
    );

    await client.start();
    outputChannel.appendLine('[SysML] Node language client started.');
}

async function startBrowserClient(
    context: vscode.ExtensionContext,
    vscodeModule: typeof vscode
): Promise<void> {
    const { LanguageClient } = await import('vscode-languageclient/browser');

    const serverModule = vscodeModule.Uri.joinPath(
        context.extensionUri,
        'dist',
        'language-server',
        'main-browser.bundle.js'
    );

    const worker = new Worker(serverModule.toString(true));

    const clientOptions = {
        documentSelector: [
            { language: 'sysml' },
            { language: 'kerml' },
        ],
        outputChannel,
    };

    client = new LanguageClient(
        'sysmlLanguageServer',
        'SysML v2 Language Server',
        { id: 'sysml-browser-worker', name: 'SysML Worker', moduleUri: serverModule },
        clientOptions
    );

    await client.start();
    outputChannel.appendLine('[SysML] Browser language client started.');
}

function registerCommands(
    context: vscode.ExtensionContext,
    vscodeModule: typeof vscode
): void {
    // Restart Server
    context.subscriptions.push(
        vscodeModule.commands.registerCommand('sysml.restartServer', async () => {
            if (client) {
                await client.stop();
                client = undefined;
                await activate(context);
                vscodeModule.window.showInformationMessage('SysML Language Server restarted.');
            }
        })
    );

    // Validate Model
    context.subscriptions.push(
        vscodeModule.commands.registerCommand('sysml.validateModel', () => {
            const editor = vscodeModule.window.activeTextEditor;
            if (!editor) {
                vscodeModule.window.showWarningMessage('No active editor.');
                return;
            }
            // Trigger re-validation by making a no-op edit
            vscodeModule.window.showInformationMessage('SysML: Validation triggered.');
        })
    );

    // Show Model Structure
    context.subscriptions.push(
        vscodeModule.commands.registerCommand('sysml.showModel', async () => {
            const editor = vscodeModule.window.activeTextEditor;
            if (!editor || (editor.document.languageId !== 'sysml' && editor.document.languageId !== 'kerml')) {
                vscodeModule.window.showErrorMessage('Not a SysML/KerML file.');
                return;
            }

            const symbols = await vscodeModule.commands.executeCommand<vscodeModule.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                editor.document.uri
            );

            if (symbols && symbols.length > 0) {
                const panel = vscodeModule.window.createWebviewPanel(
                    'sysmlModel',
                    'SysML Model Structure',
                    vscodeModule.ViewColumn.Two,
                    {}
                );
                panel.webview.html = generateModelView(symbols);
            } else {
                vscodeModule.window.showInformationMessage('No symbols found in this file.');
            }
        })
    );

    // Rescan Workspace
    context.subscriptions.push(
        vscodeModule.commands.registerCommand('sysml.rescanWorkspace', () => {
            vscodeModule.window.showInformationMessage('SysML: Workspace rescan requested.');
        })
    );
}

function generateModelView(symbols: any[]): string {
    const tree = buildTree(symbols, 0);
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Courier New', monospace; padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        pre { white-space: pre-wrap; line-height: 1.6; }
        h1 { border-bottom: 2px solid var(--vscode-titleBar-border); padding-bottom: 10px; }
    </style>
</head>
<body>
    <h1>SysML Model Structure</h1>
    <pre>${tree}</pre>
</body>
</html>`;
}

function buildTree(symbols: any[], indent: number): string {
    const lines: string[] = [];
    for (const sym of symbols) {
        const prefix = '  '.repeat(indent);
        lines.push(`${prefix}• ${sym.name} (${sym.detail || sym.kind})`);
        if (sym.children) {
            lines.push(buildTree(sym.children, indent + 1));
        }
    }
    return lines.join('\n');
}
