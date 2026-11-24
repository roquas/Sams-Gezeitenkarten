// The module's top-level await includes mountGame's asynchronous catalog load.
// window.load can fire before that work completes. Await the existing module
// promise before starting a gesture assertion's unchanged visibility deadline.
export async function openGame(page,url){
 await page.goto(url);
 await page.evaluate(async()=>{
  const entry=document.querySelector('script[type="module"][src]');
  if(!entry)throw Error('Missing application module');
  await import(entry.src);
 });
}
