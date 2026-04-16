/**
 * @sysml/stdlib - SysML v2 Standard Library
 *
 * Manages loading and caching of the SysML v2 standard library files.
 */

export { StdlibManager, type StdlibLoadResult } from './manager.js';
export { STDLIB_FILES, STDLIB_DEPENDENCY_LAYERS, getStdlibFileCount } from './manifest.js';
export { findStdlibPath, type StdlibPathOptions } from './path-resolver.js';
