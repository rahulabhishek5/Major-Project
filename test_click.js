const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Navigate to policy DP-001
  await page.evaluate(() => {
    window.AppCore.App.navigate('policy');
    window.AppCore.Views.policy.selectedId='POL-DP-001';
    window.AppCore.Views.policy.render(document.getElementById('view-container'));
  });
  await page.waitForTimeout(1000);
  
  let len1 = await page.evaluate(() => window.AppCore.StateManager.getByPath('policies').find(p => p.policy_id === 'POL-DP-001').sections.length);
  console.log("Before clicking, sections length:", len1);
  
  // Run addManualClause
  await page.evaluate(() => {
    window.AppCore.Views.policy.addManualClause('POL-DP-001');
  });
  await page.waitForTimeout(2000);
  
  let len2 = await page.evaluate(() => window.AppCore.StateManager.getByPath('policies').find(p => p.policy_id === 'POL-DP-001').sections.length);
  console.log("After clicking, sections length:", len2);
  
  await browser.close();
})();
