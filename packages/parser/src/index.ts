/**
 * @sysml/parser - SysML v2 Parser
 *
 * Provides parsing capabilities for SysML v2 and KerML.
 * Wraps the Langium-generated parser with a clean API.
 */

export { SysMLParser, type ParseOptions, type ParseResult } from './parser.js';
export { LangiumAstAdapter } from './langium-adapter.js';
export { IncrementalParser } from './incremental.js';
