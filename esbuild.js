const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',
    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

async function main() {
    // Node Build - outputs to dist/extension.js (matches package.json "main")
    const ctx = await esbuild.context({
        entryPoints: ['apps/extension/src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
        ],
    });

    // Web Build - outputs to dist/web/extension.js (matches package.json "browser")
    const webCtx = await esbuild.context({
        entryPoints: ['apps/extension/src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'browser',
        outfile: 'dist/web/extension.js',
        external: ['vscode', 'path', 'vscode-languageclient/node'],
        logLevel: 'silent',
        plugins: [
            esbuildProblemMatcherPlugin,
        ],
    });

    if (watch) {
        await ctx.watch();
        await webCtx.watch();
    } else {
        await ctx.rebuild();
        await webCtx.rebuild();
        await ctx.dispose();
        await webCtx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
