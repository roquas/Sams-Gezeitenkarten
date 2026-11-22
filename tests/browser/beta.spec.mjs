import {test,expect as baseExpect} from '@playwright/test';
// Match the dedicated matrix when CI includes this file in the existing suites.
test.describe.configure({timeout:60000});
const expect=baseExpect.configure({timeout:10000});
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const pageErrors=new WeakMap();
test.beforeEach(async({page})=>{
 const manifest=read('puzzles/manifest.json');manifest.defaultId='model-demo';manifest.puzzles=manifest.puzzles.filter(p=>p.id==='model-demo');
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));const errors=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>{expect(pageErrors.get(page)).toEqual([]);});
const read=p=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url)));
const cell=(page,id)=>page.locator(`#map .cell[data-id="${id}"]`);
const game=async page=>{await page.goto('/?puzzle=model-demo');await expect(cell(page,'A5')).toBeVisible();};
const records=page=>page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('gezeitenkarten-beta-v1:record:')).map(k=>JSON.parse(localStorage.getItem(k))));
const time=async page=>(await records(page))[0].phases.reduce((n,p)=>n+p.activeMs,0);
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('gezeitenkarten-model-demo-schema')))));
async function download(page){const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Betatest-Feedback exportieren'}).click();const file=await wait;return JSON.parse(readFileSync(await file.path(),'utf8'));}
async function solve(page,route=['B5','C5','D5']){await page.locator('#routeTool').click();for(const id of route){await cell(page,id).focus();await page.keyboard.press('Enter');}await page.locator('#verify').click();}
async function feedbackDetails(page){const details=page.locator('#feedbackRecords details').first();await details.locator('summary').click();return details;}
async function twoPuzzles(page){
 const manifest=read('puzzles/manifest.json'),dto=read('puzzles/model-demo.json');
 manifest.defaultId='model-demo';manifest.puzzles=manifest.puzzles.filter(p=>p.id==='model-demo');
 manifest.puzzles.push({id:'second',title:'Zweite Probefahrt',path:'second.json',kind:'test'});
 dto.puzzle.id='second';dto.puzzle.presentation.title='Zweite Probefahrt';dto.identity.instanceId='inst-second';dto.identity.variantId='var-second';
 dto.puzzle.logic.start='B5';dto.puzzle.logic.map.objects.push({id:'extra-land',cells:['E1'],passable:false});
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:manifest}));await page.route('**/puzzles/second.json',r=>r.fulfill({json:dto}));
}
async function settings(page){if(await page.locator('#logbookTab').isVisible())await page.locator('#logbookTab').click();const d=page.locator('details').filter({has:page.locator('#puzzleSelect')});await d.evaluate(n=>n.open=true);}

test('landing shows only the catalog, readable shared rules, and exports general-only feedback',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'Sams Gezeitenkarten',exact:true})).toBeVisible();await expect(page.locator('.beta-card')).toHaveCount(1);await expect(page.locator('.beta-card')).toContainText('Die Probefahrt');await expect(page.locator('.beta-card')).toContainText('Neu');await expect(page.getByRole('link',{name:'Beginnen',exact:true})).toBeVisible();
 await expect(page.locator('#landingRules article')).toBeVisible();expect(await page.locator('#landingRules article').innerHTML()).toBe(await page.locator('#gameRules article').innerHTML());
 expect((await download(page)).puzzles).toEqual([]);
 await page.locator('#generalFeedback').fill('Auf dem Telefon gut lesbar');await expect(page.locator('#feedbackSaveStatus')).toContainText('lokal gespeichert');
 const first=await download(page);expect(first.generalFeedback.comment).toBe('Auf dem Telefon gut lesbar');expect(first.puzzles).toEqual([]);
 await page.reload();await expect(page.locator('#generalFeedback')).toHaveValue('Auf dem Telefon gut lesbar');expect((await download(page)).testerId).toBe(first.testerId);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('selection, direct links, switch and reload retain separate saves and update cell registry',async({page})=>{
 await twoPuzzles(page);await page.goto('/');await expect(page.locator('.beta-card')).toHaveCount(2);await page.getByRole('link',{name:'Beginnen',exact:true}).first().click();await expect(cell(page,'A5')).toBeVisible();
 await cell(page,'A1').click();await settings(page);await page.locator('#puzzleSelect').selectOption('second');if(await page.locator('#chartTab').isVisible())await page.locator('#chartTab').click();
 await expect(page.locator('h1')).toHaveText('Zweite Probefahrt');await expect(cell(page,'E1')).toHaveClass(/blocked-cell/);await cell(page,'B1').focus();await page.keyboard.press('Enter');await expect(cell(page,'B1')).toContainText('?');
 await page.reload();await expect(cell(page,'B1')).toContainText('?');expect(new URL(page.url()).searchParams.get('puzzle')).toBe('second');
 await page.locator('#backToSelection').click();await expect(page.locator('.beta-card')).toContainText(['Begonnen','Begonnen']);await page.locator('.beta-card').first().getByRole('link',{name:'Fortsetzen'}).click();await expect(cell(page,'A1')).toContainText('?');await expect(page.locator('#map .cell')).toHaveCount(25);
 expect((await records(page)).length).toBe(2);await expect(cell(page,'E1')).not.toHaveClass(/blocked-cell/);await page.locator('#backToSelection').click();expect((await download(page)).puzzles).toHaveLength(2);
});
test('wrong route opens a neutral modal with focus containment and returns focus after Escape',async({page})=>{
 await game(page);await solve(page,['A4','A3','A2']);const modal=page.getByRole('dialog');await expect(modal).toContainText('Leider falsch');await expect(page.locator('#resultTitle')).toBeFocused();
 await page.keyboard.press('Tab');await expect(modal.getByRole('button')).toBeFocused();await page.keyboard.press('Tab');await expect(modal.getByRole('button')).toBeFocused();
 await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect(page.locator('#verify')).toBeFocused();expect((await records(page))[0].solvedAt).toBeNull();
 await page.locator('#verify').click();await page.getByRole('button',{name:'Schließen und weiterspielen'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('success persists across reset, feedback can be edited, replay archives earlier feedback',async({page})=>{
 await game(page);await solve(page);await expect(page.getByRole('dialog')).toContainText('Richtig gelöst!');await page.getByRole('dialog').locator('[name=difficulty]').selectOption('hard');await page.getByRole('dialog').locator('[name=comment]').fill('Erster Eindruck');await page.getByRole('button',{name:'Feedback speichern',exact:true}).click();
 expect((await records(page))[0].solvedAt).toBeTruthy();page.once('dialog',d=>d.accept());await page.locator('#reset').evaluate(n=>n.click());
 await page.locator('#backToSelection').click();await expect(page.locator('.beta-card')).toContainText('Gelöst');const details=await feedbackDetails(page);await expect(details.locator('[name=comment]')).toHaveValue('Erster Eindruck');await details.locator('[name=fairness]').selectOption('partly');await details.locator('[name=comment]').fill('Nachgetragen');
 let data=await download(page);expect(data.puzzles[0].feedback).toMatchObject({comment:'Nachgetragen',difficulty:'hard',fairness:'partly'});expect(JSON.stringify(data)).not.toContain('"route":');
 await page.getByRole('link',{name:'Erneut spielen'}).click();await expect(cell(page,'A5')).toBeVisible();let r=(await records(page))[0];expect(r.phases).toHaveLength(2);expect(r.phases[0].feedbackAtEnd.comment).toBe('Nachgetragen');expect(r.feedback.comment).toBe('');
 await page.reload();r=(await records(page))[0];expect(r.phases).toHaveLength(2);expect(r.solvedAt).toBeTruthy();await cell(page,'A1').click();await page.locator('#backToSelection').click();await page.getByRole('link',{name:'Fortsetzen',exact:true}).click();await expect(cell(page,'A1')).toContainText('?');expect((await records(page))[0].phases).toHaveLength(2);
});
test('unsolved feedback and deliberate abandonment are independent of ordinary navigation',async({page})=>{
 await page.goto('/');let details=await feedbackDetails(page);await details.locator('[name=comment]').fill('Noch nicht gespielt');let r=(await download(page)).puzzles[0];expect(r.phases).toEqual([]);
 await page.getByRole('link',{name:'Beginnen',exact:true}).click();await expect(cell(page,'A5')).toBeVisible();await cell(page,'A1').click();await page.locator('#backToSelection').click();r=(await download(page)).puzzles[0];expect(r.phases[0].status).toBe('open');
 details=await feedbackDetails(page);await details.locator('[name=status]').selectOption('abandoned');await expect(page.locator('.beta-card')).toContainText('bewusst aufgegeben');await page.reload();r=(await download(page)).puzzles[0];expect(r.phases[0].status).toBe('abandoned');expect(r.solvedAt).toBeNull();await page.getByRole('link',{name:'Fortsetzen',exact:true}).click();await expect(cell(page,'A1')).toContainText('?');r=(await records(page))[0];expect(r.phases).toHaveLength(2);expect(r.phases[1].status).toBe('open');
});
for(const reload of [false,true])test(`abandonment feedback correction resumes one preserved phase history (reload=${reload})`,async({page,context})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));
 await page.clock.install({time:new Date('2026-11-20T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-20T12:00:01Z'));
 await game(page);await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await cell(page,'A1').focus();await page.keyboard.press('Enter');await page.locator('#hint').evaluate(n=>n.click());
 await page.locator('#routeTool').click();await cell(page,'B5').focus();await page.keyboard.press('Enter');
 await page.clock.runFor(5000);const gameBefore=await saved(page);await page.locator('#backToSelection').click();
 let details=await feedbackDetails(page);await details.locator('[name=difficulty]').selectOption('hard');await details.locator('[name=comment]').fill('Bewertung vor der Korrektur');await details.locator('[name=status]').selectOption('abandoned');
 const abandoned=(await download(page)).puzzles[0];expect(abandoned.phases[0].activeMs).toBeGreaterThan(0);expect(abandoned.phases[0].status).toBe('abandoned');
 if(reload){await page.reload();details=await feedbackDetails(page);}
 await details.locator('[name=status]').selectOption('open');
 await expect(page.locator('.beta-card')).not.toContainText('bewusst aufgegeben');
 const corrected=(await download(page)).puzzles[0];expect(corrected.feedback.status).toBe('open');expect(corrected.phases).toHaveLength(1);expect(corrected.phases[0]).toEqual(abandoned.phases[0]);
 await page.clock.runFor(10000);expect((await download(page)).puzzles[0].phases).toEqual(corrected.phases);
 if(reload)await page.reload();
 const resume=page.getByRole('link',{name:'Fortsetzen',exact:true}),resumeUrl=await resume.getAttribute('href');expect(new URL(resumeUrl).searchParams.get('phase')).toBe('resume');
 await resume.click();await expect(cell(page,'A1')).toContainText('?');await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 const gameAfter=await saved(page);for(const key of ['marks','route','hintCount','penalty','doneClues'])expect(gameAfter[key]).toEqual(gameBefore[key]);
 let r=(await records(page))[0];expect(r.phases).toHaveLength(2);expect(r.phases[0]).toEqual(abandoned.phases[0]);expect(r.phases[1].phaseId).not.toBe(r.phases[0].phaseId);expect(r.phases[1]).toMatchObject({status:'open',activeMs:0,hints:0,noteChecks:0,routeChecks:0,penaltyPoints:0});expect(r.feedback).toMatchObject({status:'open',difficulty:'hard',comment:'Bewertung vor der Korrektur'});
 await page.reload();await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(5000);r=(await records(page))[0];expect(r.phases).toHaveLength(2);expect(r.phases[0]).toEqual(abandoned.phases[0]);expect(r.phases[1].activeMs).toBe(5000);
 const other=await context.newPage();await other.addInitScript(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));await other.goto(resumeUrl);await expect(other.locator('#betaTime')).toContainText('anderen Tab');expect((await records(other))[0].phases).toHaveLength(2);const shared=await time(page);await page.clock.runFor(5000);expect(await time(page)).toBe(shared+5000);await other.close();
 await page.locator('#backToSelection').click();const exported=(await download(page)).puzzles[0];expect(exported.phases).toHaveLength(2);expect(exported.phases.filter(p=>p.status==='open')).toHaveLength(1);expect(exported.phases[0]).toEqual(abandoned.phases[0]);expect(exported.phases[1].activeMs).toBeGreaterThanOrEqual(5000);expect(exported.feedback.status).toBe('open');expect(exported.solvedAt).toBeNull();
});
test('solved beta counters stay frozen while ordinary game help and new phase counters remain independent',async({page})=>{
 await game(page);await page.locator('[data-tool="yes"]').first().click();await cell(page,'A1').focus();await page.keyboard.press('Enter');
 await page.locator('#hint').evaluate(n=>n.click());await page.locator('#checkMarks').evaluate(n=>n.click());await solve(page);await page.getByRole('button',{name:'Überspringen / Schließen'}).click();
 await page.locator('#backToSelection').click();const before=(await download(page)).puzzles[0];expect(before.phases[0]).toMatchObject({status:'solved',hints:1,noteChecks:1,routeChecks:1,penaltyPoints:15});
 let details=await feedbackDetails(page);await details.locator('[name=status]').selectOption('abandoned');await details.locator('[name=status]').selectOption('open');expect((await download(page)).puzzles[0].solvedAt).toBe(before.solvedAt);await expect(page.getByRole('link',{name:'Erneut spielen',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Spielstand ansehen',exact:true}).click();await expect(page.locator('#betaTime [role="status"]')).toHaveText('Bearbeitung beendet');const oldSave=await saved(page);
 await page.locator('#hint').evaluate(n=>n.click());await page.locator('#checkMarks').evaluate(n=>n.click());await page.locator('#verify').click();await page.getByRole('button',{name:'Überspringen / Schließen'}).click();
 const helped=await saved(page);expect(helped.hintCount).toBe(oldSave.hintCount+1);expect(helped.penalty).toBe(oldSave.penalty+15);
 await page.locator('#backToSelection').click();const after=(await download(page)).puzzles[0];expect(after.phases).toEqual(before.phases);expect(after.solvedAt).toBe(before.solvedAt);
 await page.getByRole('link',{name:'Erneut spielen',exact:true}).click();await expect(cell(page,'A5')).toBeVisible();let r=(await records(page))[0];expect(r.phases[1]).toMatchObject({hints:0,noteChecks:0,routeChecks:0,penaltyPoints:0});
 await page.locator('[data-tool="yes"]').first().click();await cell(page,'A1').focus();await page.keyboard.press('Enter');await page.locator('#hint').evaluate(n=>n.click());await page.locator('#checkMarks').evaluate(n=>n.click());
 await page.locator('#backToSelection').click();r=(await download(page)).puzzles[0];expect(r.phases).toHaveLength(2);expect(r.phases[0]).toEqual({...before.phases[0],feedbackAtEnd:after.feedback});expect(r.phases[1].phaseId).not.toBe(before.phases[0].phaseId);expect(r.phases[1]).toMatchObject({status:'open',hints:1,noteChecks:1,routeChecks:0,penaltyPoints:15});expect(r.solvedAt).toBe(before.solvedAt);
});
test('timer persists reload and manual pause, excludes solved reopening, and never double counts tabs',async({page,context})=>{
 await page.clock.install();await game(page);await expect(page.locator('#betaTime')).toContainText('läuft');await page.clock.runFor(6000);const initial=await time(page);expect(initial).toBeGreaterThanOrEqual(4000);
 await page.locator('#betaTime button').click();await expect(page.locator('#betaTime')).toContainText('Zeit pausiert');await page.clock.runFor(10000);const paused=await time(page);await page.clock.runFor(10000);expect(await time(page)).toBe(paused);
 await page.reload();await expect(page.locator('#betaTime')).toContainText('Zeit pausiert');await page.locator('#betaTime button').click();
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(6000);expect(await time(page)).toBeGreaterThan(paused);
 const other=await context.newPage();await other.goto('/?puzzle=model-demo');await expect(other.locator('#betaTime')).toContainText(/anderen Tab|läuft/);await other.close();
 await solve(page);await page.getByRole('button',{name:'Überspringen / Schließen'}).click();const solved=await time(page);await page.clock.runFor(15000);expect(await time(page)).toBe(solved);await page.reload();await expect(page.locator('#betaTime')).toContainText('beendet');await page.clock.runFor(10000);expect(await time(page)).toBe(solved);
});
test('background time and 15 minute inactivity stop; explicit interaction resumes',async({page})=>{
 // Document visibility is driven at the adapter boundary; both browser engines run this deterministic case.
 await page.clock.install();await game(page);await expect(page.locator('#betaTime')).toContainText('läuft');await page.clock.runFor(5000);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const before=await time(page);await page.clock.runFor(30000);expect(await time(page)).toBe(before);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 // Advancing mocked timers does not await the browser's native Web Lock grant.
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(5000);expect(await time(page)).toBeGreaterThan(before);
 await page.clock.runFor(15*60*1000);await expect(page.locator('#betaTime')).toContainText('15 Min.');const idle=await time(page);await page.clock.runFor(10000);expect(await time(page)).toBe(idle);
 await page.locator('#betaTime button').click();
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(5000);expect(await time(page)).toBeGreaterThan(idle);
});
test('inactivity resume counts only after a delayed native Web Lock grant',async({page})=>{
 await page.addInitScript(()=>{
  const manager=Object.getPrototypeOf(navigator.locks),request=manager.request;
  // Keep real exclusive locks; control only delivery of the resumed grant.
  manager.request=function(name,options,callback){return request.call(this,name,options,async lock=>{
   if(lock&&window.deferBetaGrant)await new Promise(resolve=>{window.deliverBetaGrant=resolve;});
   return callback(lock);
  });};
 });
 await page.clock.install({time:new Date('2026-11-20T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-11-20T12:00:01Z'));
 await game(page);await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(15*60*1000);await expect(page.locator('#betaTime')).toContainText('15 Min.');
 const idle=await time(page);
 await expect.poll(()=>page.evaluate(async()=>(await navigator.locks.query()).held.length)).toBe(0);
 await page.evaluate(()=>{window.deferBetaGrant=true;});await page.locator('#betaTime button').click();
 await expect.poll(()=>page.evaluate(()=>typeof window.deliverBetaGrant)).toBe('function');
 expect((await records(page))[0].phases.at(-1).paused).toBe(false);
 await page.clock.runFor(5000);expect(await time(page)).toBe(idle);
 await page.evaluate(()=>window.deliverBetaGrant());
 await expect(page.locator('#betaTime [role="status"]')).toHaveText('Aktive Zeit läuft · Näherungswert');
 await page.clock.runFor(5000);expect(await time(page)).toBe(idle+5000);
 await page.locator('#backToSelection').click();
 expect((await download(page)).puzzles[0].phases.at(-1).activeMs).toBe(idle+5000);
});
test('revision and catalog removal keep distinct records in export',async({page})=>{
 await game(page);await page.locator('#backToSelection').click();const details=await feedbackDetails(page);await details.locator('[name=comment]').fill('Version eins');
 const dto=read('puzzles/model-demo.json');dto.puzzle.dataVersion=2;dto.identity.sourcePublicationId='pub-revision-two';await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));await page.reload();await page.getByRole('link',{name:'Beginnen',exact:true}).click();await expect(cell(page,'A5')).toBeVisible();await page.locator('#backToSelection').click();
 let data=await download(page);expect(data.puzzles).toHaveLength(2);expect(data.puzzles.map(p=>p.identity.dataVersion).sort()).toEqual([1,2]);
 await page.route('**/puzzles/manifest.json',r=>r.fulfill({json:{schemaVersion:2,defaultId:null,puzzles:[]}}));await page.reload();await expect(page.locator('.beta-card')).toHaveCount(0);data=await download(page);expect(data.puzzles).toHaveLength(2);expect(data.puzzles.some(p=>p.feedback.comment==='Version eins')).toBe(true);
});
for(const failure of ['quota','disabled'])test('storage '+failure+' shows a truthful warning and still exports in-page feedback',async({page})=>{
 await page.addInitScript(failure=>{
  if(failure==='disabled')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Disabled','SecurityError');}});
  else Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};
 },failure);
 await page.goto('/');await expect(page.locator('#storageNotice')).toBeVisible();await page.locator('#generalFeedback').fill('Bitte erhalten');await expect(page.locator('#feedbackSaveStatus')).toContainText('nicht dauerhaft');expect((await download(page)).generalFeedback.comment).toBe('Bitte erhalten');
});
test('subdirectory deployment resolves links, rules, catalog, game modules and export',async({page})=>{
 // Serve the actual files beneath a prefix without rewriting any application URLs.
 await page.route('**/nested/beta/**',async route=>{
  const relative=new URL(route.request().url()).pathname.replace('/nested/beta/','')||'index.html';
  const extension=relative.split('.').at(-1),contentType={mjs:'text/javascript',css:'text/css',json:'application/json',html:'text/html',svg:'image/svg+xml',jpg:'image/jpeg',webp:'image/webp',png:'image/png'}[extension];
  await route.fulfill({path:fileURLToPath(new URL('../../'+relative,import.meta.url)),contentType});
 });
 await page.goto('/nested/beta/');await expect(page.locator('.beta-card')).toHaveCount(2);await page.locator('.beta-card').filter({hasText:'Die Probefahrt'}).getByRole('link',{name:'Beginnen',exact:true}).click();expect(new URL(page.url()).pathname).toBe('/nested/beta/');await expect(cell(page,'A5')).toBeVisible();await page.locator('#backToSelection').click();await expect(page.locator('#landingRules article')).toBeVisible();expect((await download(page)).puzzles).toHaveLength(1);
});
test('unknown direct links fail visibly without silently selecting another puzzle',async({page})=>{
 await page.goto('/?puzzle=missing');await expect(page.locator('#puzzleLoadError')).toContainText('Unbekanntes Rätsel');await expect(page.locator('#map .cell')).toHaveCount(0);
});
test('independent custom result text survives the existing public schema and beta transport',async({page})=>{
 const dto=read('puzzles/model-demo.json');dto.puzzle.resultTexts={incorrect:'Bitte die Beobachtungen erneut vergleichen.'};await page.route('**/puzzles/model-demo.json',r=>r.fulfill({json:dto}));
 await game(page);await solve(page,['A4','A3','A2']);await expect(page.locator('#resultMessage')).toHaveText('Bitte die Beobachtungen erneut vergleichen.');await page.keyboard.press('Escape');page.once('dialog',d=>d.accept());await page.locator('#reset').evaluate(n=>n.click());await solve(page);await expect(page.locator('#resultMessage')).toHaveText('Du hast die gesuchte Route rekonstruiert.');
});
test('an in-game quota failure retains voluntarily saved feedback for immediate export',async({page})=>{
 await game(page);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};});
 await solve(page);await page.getByRole('dialog').locator('[name=comment]').fill('Trotz Speicherfehler erhalten');await page.getByRole('button',{name:'Feedback speichern',exact:true}).click();
 await expect(page.locator('#storageNotice')).toBeVisible();const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Feedback jetzt exportieren'}).click();const file=await downloading;const data=JSON.parse(readFileSync(await file.path(),'utf8'));expect(data.puzzles[0].feedback.comment).toBe('Trotz Speicherfehler erhalten');expect(data.puzzles[0].solvedAt).toBeTruthy();
});
test('multiple tabs share one timer and an old solved view cannot count a new phase',async({page,context})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));
 await page.clock.install({time:new Date('2026-11-20T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-20T12:00:01Z'));await game(page);await expect(page.locator('#betaTime')).toContainText('läuft');
 const other=await context.newPage();await other.addInitScript(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));await other.goto('/?puzzle=model-demo');await expect(other.locator('#betaTime')).toContainText('anderen Tab');
 const before=await time(page);await page.clock.runFor(5000);const delta=await time(page)-before;expect(delta).toBeGreaterThanOrEqual(4900);expect(delta).toBeLessThan(6500);
 await solve(page);await page.getByRole('button',{name:'Überspringen / Schließen'}).click();await other.goto('/?puzzle=model-demo&phase=new');await expect(other.locator('#betaTime')).toContainText('läuft');
 // Playwright's clock controls the entire context, including both tabs.
 const beforePhase=(await records(other))[0];await page.clock.runFor(5000);const afterPhase=(await records(other))[0];expect(afterPhase.phases[0].activeMs).toBe(beforePhase.phases[0].activeMs);expect(afterPhase.phases[1].activeMs-beforePhase.phases[1].activeMs).toBe(5000);await other.close();
});
