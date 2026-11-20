import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 timeout:60000,expect:{timeout:10000},testDir:'./tests/browser',testMatch:'beta.spec.mjs',fullyParallel:true,workers:2,retries:0,
 use:{baseURL:'http://127.0.0.1:4187',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'mobile-chromium',use:{...devices['Pixel 7']}},{name:'webkit',use:{...devices['Desktop Safari']}},{name:'mobile-webkit',use:{...devices['iPhone 13']}}],
 webServer:{command:'python3 scripts/dev-server.py --port 4187',url:'http://127.0.0.1:4187/',reuseExistingServer:false,timeout:20000}
});
