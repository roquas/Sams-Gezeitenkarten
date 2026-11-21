// Test-only attribution: trusted main history is distinct from PR-owned commits.
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';

export function assertBranchPreservesPaths({repository,base,head,main,paths}){
 const options={cwd:repository,encoding:'utf8',maxBuffer:16*1024*1024};
 const git=(...args)=>execFileSync('git',args,options).trim();
 const ancestor=(a,b)=>{
  const r=spawnSync('git',['merge-base','--is-ancestor',a,b],options);
  assert.ifError(r.error);assert.ok(r.status===0||r.status===1,r.stderr);return r.status===0;
 };
 assert.ok(ancestor(base,head),'Fixed S04-B base is not an ancestor of PR head');
 assert.ok(ancestor(base,main),'Trusted main does not contain the fixed S04-B base');
 const unchanged=(before,after,commit)=>{
  const changed=git('diff-tree','--no-commit-id','--no-renames','--name-only','-r',before,after,'--',...paths);
  assert.equal(changed,'',`PR modified protected paths in ${commit}: ${changed}`);
 };
 // Inspect ALL PR-only commits, including side branches and changes later
 // reverted. A final net diff or an exclusion of every merge would miss these.
 const commits=git('rev-list','--reverse','--topo-order','--parents',head,'--not',main).split('\n').filter(Boolean);
 for(const line of commits){
  const [commit,...parents]=line.split(' ');
  assert.ok(parents.length,'Unexpected unrelated root in PR history');
  if(parents.length===2&&ancestor(parents[1],main)){
   // A normal main merge may import protected files, but may not sneak in
   // protected merge-resolution edits. Recompute the automatic parent merge.
   const merged=spawnSync('git',['merge-tree','--write-tree',...parents],options);
   assert.ifError(merged.error);
   assert.ok(merged.status===0||merged.status===1,merged.stderr);
   const tree=merged.stdout.split('\n')[0];assert.match(tree,/^[a-f0-9]{40}$/);
   // Status 1 can describe conflicts outside the protected paths. Protected
   // resolutions must still match the independently computed merge tree.
   unchanged(tree,commit,commit);
  }else unchanged(parents[0],commit,commit);
 }
}
