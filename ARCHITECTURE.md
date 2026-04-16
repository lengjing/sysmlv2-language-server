# SysML v2 Language Server — Architecture

## Overview

This project is a **production-grade, modular SysML v2 language toolchain** built with TypeScript. It follows clean architecture principles with clear separation of concerns.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
│  ┌───────────────────┐  ┌────────────────────────────────┐  │
│  │   VSCode Extension │  │   Web App (Monaco + WebSocket) │  │
│  │   (LSP Client)     │  │                                │  │
│  └────────┬──────────┘  └──────────────┬─────────────────┘  │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │ LSP Protocol                          │
│  ┌───────────────────▼──────────────────────────────────┐   │
│  │              Language Server (LSP)                     │   │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │Completion│ │  Hover  │ │Definition│ │References│ │   │
│  │  └────┬─────┘ └────┬────┘ └────┬─────┘ └────┬─────┘ │   │
│  │       └─────────────┼──────────┼─────────────┘       │   │
│  └─────────────────────┼──────────┼─────────────────────┘   │
│                        │          │                          │
│           ┌────────────▼──────────▼────────────┐            │
│           │        Semantic Model               │            │
│           │  ┌────────────┐  ┌───────────────┐ │            │
│           │  │Symbol Table│  │ Type Registry │ │            │
│           │  └────────────┘  └───────────────┘ │            │
│           │  ┌────────────┐  ┌───────────────┐ │            │
│           │  │   Scopes   │  │  Validation   │ │            │
│           │  └────────────┘  └───────────────┘ │            │
│           └────────────────┬───────────────────┘            │
│                            │                                 │
│              ┌─────────────▼─────────────┐                  │
│              │       AST Layer            │                  │
│              │  Nodes • Identity • Builder│                  │
│              └─────────────┬──────────────┘                  │
│                            │                                 │
│              ┌─────────────▼─────────────┐                  │
│              │        Parser              │                  │
│              │  Langium Adapter           │                  │
│              │  Incremental Strategy      │                  │
│              └────────────────────────────┘                  │
│                                                              │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐               │
│  │   Protocol   │  │  Utils   │  │  Stdlib  │               │
│  │ (Shared Types)│  │(Log/Cfg) │  │(Std Lib) │               │
│  └──────────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Processing Pipeline

```
Source Text
    │
    ▼
┌─────────┐
│  Parser  │ ── Langium tokenizer + parser
└────┬─────┘
     │ Langium AST
     ▼
┌──────────────┐
│ AST Adapter   │ ── Converts to clean @sysml/ast types
└────┬──────────┘
     │ DocumentAst
     ▼
┌──────────────┐
│ Semantic Model│ ── Symbol extraction, scope building, type registration
└────┬──────────┘
     │ Indexed model
     ▼
┌──────────────┐
│  Validation   │ ── Rule-based validation engine
└────┬──────────┘
     │ Diagnostics
     ▼
┌──────────────┐
│  LSP Output   │ ── Diagnostics, completions, hover, etc.
└──────────────┘
```

## Packages

| Package | Description |
|---------|-------------|
| `@sysml/protocol` | Shared types, interfaces, events, configuration |
| `@sysml/ast` | AST node definitions, identity system, traversal, builder |
| `@sysml/utils` | Logger, event emitter, plugin system, config loader |
| `@sysml/parser` | SysML/KerML parser with Langium adapter, incremental strategy |
| `@sysml/semantics` | Symbol table, scope resolution, type system, validation rules |
| `@sysml/stdlib` | Standard library manifest, path resolution, loading |
| `@sysml/language-server` | LSP server, document management, diagnostics, LSP features |

## Key Design Decisions

### 1. Stable Node IDs
Every AST node has a stable ID based on its structural position (parent path + type + name). This enables:
- Incremental updates (only affected subtrees are re-processed)
- CRDT integration (external systems can reference nodes by ID)
- AI agent integration (stable references for model generation)

### 2. Plugin-Based Validation
Validation rules are registered dynamically, not hardcoded. Rules can be:
- Built-in (shipped with the server)
- User-defined (via plugins)
- Disabled per-project (via configuration)

### 3. Separation of Parser and Semantics
The parser produces a clean AST; semantic analysis is a separate phase. This allows:
- Different parsers (Langium, tree-sitter, etc.)
- Testing semantics without parsing
- Independent evolution of each layer

### 4. Event-Driven Architecture
Components communicate via typed events. This enables:
- Loose coupling between layers
- Easy testing with mock events
- Future features like live collaboration

## Running

### VSCode Extension
```bash
npm install
npm run build
# Press F5 in VS Code to launch Extension Development Host
```

### Web App
```bash
cd apps/webApp
# Open src/index.html in a browser
# Connect to a running LSP server via WebSocket
```

## CRDT Integration (Future)

The stable node ID system enables CRDT integration:

```typescript
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const ymodel = ydoc.getMap('sysml-model');

// When AST changes, sync to CRDT
semanticModel.events.on('symbolResolved', (event) => {
    ymodel.set(event.nodeId, {
        qualifiedName: event.qualifiedName,
    });
});
```

## AI Agent Integration (Future)

The semantic model provides a clean API for AI-assisted modeling:

```typescript
// AI agent can query the model
const symbols = semanticModel.symbolTable.lookupByName('Vehicle');
const scope = semanticModel.scopeResolver.getScopeFor(nodeId, doc);

// AI agent can generate valid SysML
const builder = new DocumentAstBuilder('ai://generated.sysml');
const root = builder.createRootNamespace();
builder.createDefinition(root.id, SysMLMetatype.PartDefinition, 'NewPart', 0);
```
