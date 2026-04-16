# Contributing to SysML v2 Language Server

Thank you for your interest in contributing to this project. This document provides guidelines for contributing to the SysML v2 Language Server and VS Code extension.

## How to Report Bugs

Please report bugs by opening an issue at [GitHub Issues](https://github.com/vpathai-git/sysmlv2-language-server/issues). Include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Your environment (OS, Node.js version, VS Code version)
- Relevant log output or error messages

## How to Suggest Enhancements

Enhancement suggestions are also tracked via [GitHub Issues](https://github.com/vpathai-git/sysmlv2-language-server/issues). When suggesting an enhancement, please describe:

- The use case or problem the enhancement would address
- Your proposed solution or approach
- Any alternatives you have considered

## Contributor License Agreement (CLA)

All contributors must sign our [Contributor License Agreement](.github/CLA.md) before their pull requests can be merged. The CLA bot will automatically prompt you when you open your first PR. To sign, simply add a comment:

> I have read the CLA Document and I hereby sign the CLA.

The CLA ensures that the license structure of this project is preserved. See the License Structure section below for details.

## Pull Request Workflow

1. Fork the repository
2. Create a feature branch from `main` (e.g., `feat/my-feature` or `fix/my-bugfix`)
3. Make your changes
4. Ensure the project builds successfully
5. Sign the CLA (if this is your first contribution)
6. Submit a pull request targeting the `main` branch

Keep pull requests focused on a single change. Provide a clear description of what the PR does and why.

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/<your-username>/sysmlv2-language-server.git
cd sysmlv2-language-server

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test
```

## Project Structure

```
packages/          # Core library packages
  protocol/        # Shared types, interfaces, events
  ast/             # AST nodes, identity, traversal, builder
  utils/           # Logger, event emitter, plugin system
  parser/          # SysML/KerML parser with Langium adapter
  semantics/       # Symbol table, scope, types, validation
  stdlib/          # Standard library manifest and loading
  language-server/ # LSP server, document management, features
apps/              # Applications
  extension/       # VSCode extension (LSP client)
  webApp/          # Monaco editor + WebSocket client
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design documentation.

## Code Style

- Write TypeScript following the patterns and conventions already established in the codebase
- No trailing whitespace
- Use clear, descriptive names for variables, functions, and types
- Follow the layered architecture: parser → ast → semantics → language-server
- No cross-layer violations (e.g., LSP code must not import from parser directly)

## PR Checklist

Before submitting a PR, ensure:

- [ ] `npm run build` succeeds
- [ ] `npm run test` passes
- [ ] No new dependencies with copyleft licenses (GPL, LGPL, AGPL)

## Adding Validation Rules

1. Reference the relevant SysML v2 specification section
2. Implement the `ValidationRule` interface in `packages/semantics/src/builtin-rules.ts`
3. Register the rule via the `ValidationEngine` rule registry

## Dependency Licenses

All new dependencies MUST use permissive licenses:
- **Allowed:** MIT, Apache 2.0, BSD, ISC
- **Prohibited:** GPL, LGPL, AGPL, or any copyleft license

## License Structure

This project is licensed under LGPL-3.0-or-later.

| Package | License | Contains |
|---------|---------|----------|
| `@sysml/protocol` | LGPL-3.0-or-later | Shared types and interfaces |
| `@sysml/ast` | LGPL-3.0-or-later | AST node definitions |
| `@sysml/utils` | LGPL-3.0-or-later | Utility infrastructure |
| `@sysml/parser` | LGPL-3.0-or-later | Parser with Langium adapter |
| `@sysml/semantics` | LGPL-3.0-or-later | Semantic analysis engine |
| `@sysml/stdlib` | LGPL-3.0-or-later | Standard library management |
| `@sysml/language-server` | LGPL-3.0-or-later | LSP server implementation |

By submitting a contribution, you agree to the terms of the [Contributor License Agreement](.github/CLA.md).
