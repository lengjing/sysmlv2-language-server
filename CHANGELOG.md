# Changelog

All notable changes to the SysML v2 Language Support extension will be documented in this file.

## [0.2.0] - 2026-04-16

### Changed

- **Full architecture migration** to modular monorepo design
- New layered package structure: `@sysml/protocol`, `@sysml/ast`, `@sysml/utils`, `@sysml/parser`, `@sysml/semantics`, `@sysml/stdlib`, `@sysml/language-server`
- VSCode extension moved to `apps/extension/` with clean LSP client
- Web application added at `apps/webApp/` (Monaco editor + WebSocket)
- Build system migrated to Turborepo
- Plugin-based validation engine replacing hardcoded validator registry
- Stable node ID system for incremental updates and CRDT integration
- Event-driven architecture with typed events for loose coupling

### Removed

- Legacy `src/` directory (monolithic Langium-coupled codebase)
- Legacy `scripts/` directory (build shell scripts)
- `@sysml/grammar` package (replaced by `@sysml/parser` with Langium adapter)
- `@sysml/core` package (replaced by `@sysml/ast` + `@sysml/semantics`)
- `@sysml/shim` package (EMF compatibility layer no longer needed)
- Legacy browser/node client polyfill plugins in esbuild

## [0.1.0] - 2026-02-20

### Added

- SysML v2 and KerML syntax highlighting with TextMate grammar
- Language Server Protocol (LSP) support powered by Langium
- Real-time validation with 210+ validation rules per the SysML v2 specification
- Scope resolution and cross-reference support
- Commands: Restart Server, Rescan Workspace, Show Model Structure
- File icons for `.sysml` and `.kerml` files

### Notes

- This is the initial open-source release under LGPL-3.0-or-later
- See [NOTICE](NOTICE) for full attribution
