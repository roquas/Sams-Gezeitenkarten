import {defineConfig,devices} from '@playwright/test';
// Targeted Safari/WebKit regressions; the complete Chromium suite remains separate.
export default defineConfig({
 testDir:'./tests/browser',
 testMatch:['**/parchment-frame.spec.mjs','**/land-hex-regression.spec.mjs'],
 grep:/visible frame choice|blocked hexes|coordinate inkblots/,
 retries:process.env.CI?1:0,
 reporter:process.env.CI?[['github'],['html',{open:'never'}]]:'list',
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'webkit-desktop',use:{...devices['Desktop Safari']}},{name:'webkit-mobile',use:{...devices['iPhone 13']}}],
 webServer:{command:'python3 scripts/dev-server.py --port 4173',url:'http://127.0.0.1:4173/',reuseExistingServer:!process.env.CI,timeout:20000}
});
