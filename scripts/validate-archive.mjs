// Offline integrity check; no export or browser-facing API.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateArchive} from './lib/publication-archive.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(readFileSync(new URL('../archive/publications-v2.json',import.meta.url)));
validateArchive(manifest,{readBytes:(path,commit)=>execFileSync('git',['show',`${commit}:${path}`],{cwd:root,maxBuffer:32*1024*1024})});
console.log(`Archive v2: ${manifest.publications.length} publications verified.`);
