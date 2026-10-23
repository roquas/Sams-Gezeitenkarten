import path from 'node:path';

// Package-relative URL paths, shared by disk packages and pinned snapshots.
// Deployment URL prefixes are supplied by the host, never baked into these paths.
export function resolvePackagePath(directory,reference){
 for(const value of [directory,reference])if(typeof value!=='string'||/^[\/]|[\\:%?#]/.test(value))throw Error('Invalid package reference: '+value);
 const resolved=path.posix.normalize(path.posix.join(directory,reference));
 if(resolved==='..'||resolved.startsWith('../'))throw Error('Package source escapes root: '+reference);
 return resolved.replace(/\/$/,'')||'.';
}
