# SysML v2 Language Support

> by [VPATH AI](https://github.com/vpathai-git) — Digital Twin by Derivation

[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project provides language support for SysML v2 in VS Code, including:
- Syntax Highlighting
- Validation (plugin-based rule engine)
- Language Server Protocol (LSP) support
- Completions, Hover, Definitions, References, Document Symbols

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages and extension
npm run build

# Run tests
npm run test

# Package the extension
npm run package
```

## Architecture

A modular, layered SysML v2 language toolchain built with TypeScript. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design documentation.

### Project Structure

```
sysmlv2-language-server/
├── packages/                     # Core library packages
│   ├── protocol/                 # Shared types, interfaces, events
│   ├── ast/                      # AST nodes, identity, traversal, builder
│   ├── utils/                    # Logger, event emitter, plugin system
│   ├── parser/                   # SysML/KerML parser with Langium adapter
│   ├── semantics/                # Symbol table, scope, types, validation
│   ├── stdlib/                   # Standard library manifest and loading
│   └── language-server/          # LSP server, document management, features
├── apps/                         # Applications
│   ├── extension/                # VSCode extension (LSP client)
│   └── webApp/                   # Monaco editor + WebSocket client
├── sysml_resources/              # Syntax highlighting (TextMate grammar)
├── media/                        # Extension icons
└── specifications/               # SysML v2 spec examples
```

### Processing Pipeline

```
Source Text → Parser → AST Adapter → Semantic Model → Validation → LSP Output
```

---

## Development Workflow

### Building

```bash
# Build all packages (uses Turborepo)
npm run build:packages

# Build extension bundle (uses esbuild)
npm run build:extension

# Full build
npm run build
```

### Testing

```bash
npm run test
```

---

## Acknowledgments

This project builds on the work of the SysML v2 community:

- **[SysML v2 Pilot Implementation](https://github.com/Systems-Modeling/SysML-v2-Pilot-Implementation)** (LGPL-3.0-or-later) — The official OMG reference implementation. Our grammar definitions, standard library, and validation codes are derived from this project.
- **[SysIDE / sysml-2ls](https://github.com/sensmetry/sysml-2ls)** (EPL-2.0) by [Sensmetry](https://sensmetry.com) — A Langium-based SysML v2 language server that served as an architectural reference.
- **[Langium](https://langium.org)** (MIT) by Eclipse Foundation / TypeFox — The language engineering framework powering this implementation.

## License

This project uses a **dual-license** model:

| Package | License | Description |
|---------|---------|-------------|
| `@sysml/protocol` | LGPL-3.0-or-later | Shared types and interfaces |
| `@sysml/ast` | LGPL-3.0-or-later | AST node definitions |
| `@sysml/utils` | LGPL-3.0-or-later | Utility infrastructure |
| `@sysml/parser` | LGPL-3.0-or-later | Parser with Langium adapter |
| `@sysml/semantics` | LGPL-3.0-or-later | Semantic analysis engine |
| `@sysml/stdlib` | LGPL-3.0-or-later | Standard library management |
| `@sysml/language-server` | LGPL-3.0-or-later | LSP server implementation |
| Root extension | LGPL-3.0-or-later | VS Code extension bundle |

See [LICENSES/](LICENSES/) for full license texts and [NOTICE](NOTICE) for attribution.

Copyright (c) 2025-2026 VPATHAI.
