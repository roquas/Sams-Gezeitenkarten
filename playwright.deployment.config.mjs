import {defineConfig,devices} from '@playwright/test';
if(!process.env.DEPLOY_ROOT)throw Error('DEPLOY_ROOT must point to a freshly extracted deployment ZIP');
export default defineConfig({
 testDir:'./tests/deployment',fullyParallel:true,retries:process.env.CI?1:0,timeout:180000,
 outputDir:'deployment-test-results',
 reporter:[['list'],['html',{outputFolder:'deployment-report',open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4174/gk/pr38/',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'desktop',use:{...devices['Desktop Chrome']}},
  {name:'smartphone',use:{...devices['Pixel 7'],viewport:{width:360,height:800}}},
  {name:'iphone-webkit',testMatch:['**/startup.spec.mjs','**/stabilization.spec.mjs','**/blocked-hex.spec.mjs'],use:{...devices['iPhone 13'],deviceScaleFactor:1}},
  {name:'ipad-webkit',use:{...devices['iPad (gen 7)'],deviceScaleFactor:1}}
 ],
 webServer:[{command:'python3 tests/deployment/static_host.py',url:'http://127.0.0.1:4174/gk/pr38/',reuseExistingServer:false,timeout:20000},...(process.env.BASELINE_ROOT?[{command:'python3 tests/deployment/static_host.py',env:{DEPLOY_ROOT:process.env.BASELINE_ROOT,DEPLOY_PORT:'4175'},url:'http://127.0.0.1:4175/gk/pr38/',reuseExistingServer:false,timeout:20000}]:[]),...(process.env.LAND_BASELINE_ROOT?[{command:'python3 tests/deployment/static_host.py',env:{DEPLOY_ROOT:process.env.LAND_BASELINE_ROOT,DEPLOY_PORT:'4176'},url:'http://127.0.0.1:4176/gk/pr38/',reuseExistingServer:false,timeout:20000}]:[])]
});
