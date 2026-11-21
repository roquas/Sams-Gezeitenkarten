import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {assertBranchPreservesPaths} from '../helpers/branch-preservation.mjs';

const paths=['src/engine','src/puzzles','docs/verification/S03'];
function fixture(t){
 const repository=fs.mkdtempSync(path.join(os.tmpdir(),'s04-b-history-'));
 t.after(()=>fs.rmSync(repository,{recursive:true,force:true}));
 const git=(...args)=>execFileSync('git',args,{cwd:repository,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const write=(ref,text)=>{fs.mkdirSync(path.dirname(path.join(repository,ref)),{recursive:true});fs.writeFileSync(path.join(repository,ref),text);};
 const commit=message=>{git('add','.');git('commit','-qm',message);return git('rev-parse','HEAD');};
 git('init','-q','-b','main');git('config','user.name','Regression fixture');git('config','user.email','fixture@example.invalid');
 git('config','commit.gpgsign','false');git('config','core.hooksPath','/dev/null');
 write('src/puzzles/public.mjs','original public contract\n');write('src/engine/rules.mjs','original engine\n');
 write('docs/verification/S03/evidence.json','{"historical":true}\n');
 const base=commit('Fixed baseline');
 git('switch','-qc','codex/fixture');write('notes.txt','allowed PR work\n');commit('PR changes outside protected paths');
 git('switch','-q','main');write('src/puzzles/public.mjs','legitimate main public contract\n');commit('First main update');
 git('switch','-q','codex/fixture');git('merge','-q','--no-ff','main','-m','Merge first main');
 git('switch','-q','main');write('src/engine/rules.mjs','legitimate later main engine\n');
 write('src/engine/added.mjs','legitimate new main file\n');commit('Second main update');
 git('switch','-q','codex/fixture');git('merge','-q','--no-ff','main','-m','Merge second main');
 const check=()=>assertBranchPreservesPaths({repository,base,head:'HEAD',main:'main',paths});
 return {repository,git,write,commit,check};
}

test('two successive legitimate main merges retain protected imports without attributing them to S04-B',t=>{
 const f=fixture(t);f.check();f.write('notes.txt','further allowed PR work\n');f.commit('More PR-only work');f.check();
});
test('manual conflict resolution outside protected paths remains permitted',t=>{
 const f=fixture(t);f.git('switch','-q','main');f.write('notes.txt','independent main note\n');f.commit('Main note');
 f.git('switch','-q','codex/fixture');
 const merge=spawnSync('git',['merge','--no-commit','--no-ff','main'],{cwd:f.repository,encoding:'utf8'});
 assert.ifError(merge.error);assert.equal(merge.status,1,'fixture must have a real unprotected conflict');
 f.write('notes.txt','resolved allowed notes\n');f.commit('Resolve only the unprotected note');f.check();
});
for(const [label,change] of [
 ['edit',f=>f.write('src/puzzles/public.mjs','unauthorized PR edit\n')],
 ['addition',f=>f.write('src/engine/forbidden.mjs','unauthorized PR addition\n')],
 ['deletion',f=>fs.unlinkSync(path.join(f.repository,'src/engine/rules.mjs'))],
 ['historical edit',f=>f.write('docs/verification/S03/evidence.json','{"historical":false}\n')]
])test('reject a PR-owned protected '+label+' after legitimate main merges',t=>{
 const f=fixture(t);change(f);f.commit('Unauthorized protected change');
 assert.throws(f.check,/PR modified protected paths/);
});
test('reject an unauthorized edit even if a later PR commit reverts the final tree',t=>{
 const f=fixture(t),before=f.git('rev-parse','HEAD');
 f.write('src/puzzles/public.mjs','unauthorized transient edit\n');const bad=f.commit('Bad protected edit');
 f.git('revert','--no-edit',bad);
 assert.equal(f.git('diff',before,'HEAD','--',...paths),'');
 assert.throws(f.check,/PR modified protected paths/);
});
test('reject a protected edit hidden inside an otherwise legitimate main merge commit',t=>{
 const f=fixture(t);f.git('switch','-q','main');f.write('main-note.txt','new main work\n');f.commit('Third main update');
 f.git('switch','-q','codex/fixture');f.git('merge','--no-commit','--no-ff','main');
 f.write('src/puzzles/public.mjs','unauthorized merge-resolution edit\n');f.commit('Main merge with hidden edit');
 assert.throws(f.check,/PR modified protected paths/);
});
test('a non-main side branch cannot smuggle a protected change through a merge',t=>{
 const f=fixture(t);f.git('switch','-qc','side');f.write('src/puzzles/public.mjs','unauthorized side-branch edit\n');
 f.commit('Protected side-branch edit');f.git('switch','-q','codex/fixture');f.git('merge','-q','--no-ff','side','-m','Merge side');
 assert.throws(f.check,/PR modified protected paths/);
});
