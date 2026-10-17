import {defineConfig,devices} from '@playwright/test';
// Full Safari/WebKit regression suite; Chromium runs separately.
export default defineConfig({
 testDir:'./tests/browser',fullyParallel:true,workers:1,
 // Keep a worker exclusive to software-rendered DPR-2 tests; CI uses shards.
 retries:process.env.CI?1:0,
 reporter:process.env.CI?[['github'],['html',{open:'never'}],['json',{outputFile:process.env.PLAYWRIGHT_JSON_OUTPUT_NAME||'webkit-results.json'}]]:'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:process.env.CI?'on-first-retry':'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'webkit-desktop',use:{...devices['Desktop Safari']}},{name:'webkit-mobile',use:{...devices['iPhone 13'],deviceScaleFactor:1}}],
 webServer:{command:'python3 scripts/dev-server.py --port 4173',url:'http://127.0.0.1:4173/',reuseExistingServer:!process.env.CI,timeout:20000}
});
