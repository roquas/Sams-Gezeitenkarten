import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const original=[
 [
  "prototypes/3.6/.DS_Store",
  "c32883842752acf742ff9e4a68f0123bb24f31f0"
 ],
 [
  "prototypes/3.6/README.md",
  "f90d4c0bfb87575482c43cbbd2a6e716573523e6"
 ],
 [
  "prototypes/3.6/assets/insel-einzeln-01.png",
  "45ca5107981cabddb6f0e46ff97d1132fc39319e"
 ],
 [
  "prototypes/3.6/assets/insel-einzeln-02.png",
  "57660b5aee0d8db210155641bdf10b6415212f4b"
 ],
 [
  "prototypes/3.6/assets/insel-zweier-01.png",
  "2c3b8eb451a9b6f8f87c8050a2998a51d2b666cb"
 ],
 [
  "prototypes/3.6/assets/insel-zweier-02.png",
  "029218681f0dc09c04fafe27196e39d70f7ba048"
 ],
 [
  "prototypes/3.6/assets/krabbe-01.png",
  "715a0a97337b30cde2898d126f1f926b83284d5a"
 ],
 [
  "prototypes/3.6/assets/leuchtturm-01.png",
  "b49043add441f8263c783dec125a3fecbe4c0380"
 ],
 [
  "prototypes/3.6/assets/leuchtturm-02.png",
  "2480d03f5341ed2a0d8f7e69ed9cb68387ca10d6"
 ],
 [
  "prototypes/3.6/assets/meer-01.webp",
  "a49e7318c480f57e2f5344f0fd5bf2ffabdcff4c"
 ],
 [
  "prototypes/3.6/assets/riff-01.png",
  "6e909745fe9bc91a30312d4cdef1d574fa9bbb06"
 ],
 [
  "prototypes/3.6/assets/segelboot-01.png",
  "0dd50e0dd919563ef0a8b363d1a12c5806726768"
 ],
 [
  "prototypes/3.6/assets/segelboot-02.png",
  "881448921d06f0828d9334fee186c7ffea342cc8"
 ],
 [
  "prototypes/3.6/assets/strudel-01.png",
  "497b44c1960008d32498e92f6ecaee41a99b5bd8"
 ],
 [
  "prototypes/3.6/index.html",
  "98f9d1b3d67c9368d0e9e0f9551fad1930b4ae55"
 ]
];
test('archived prototype 3.6 and all assets remain byte-identical',async()=>{
 for(const [path,sha] of original){const bytes=await readFile(new URL('../../'+path,import.meta.url));const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');assert.equal(actual,sha,path);}
});

