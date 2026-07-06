// Quick E2E smoke check with Playwright (dev only)
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');

function getTotpCode() {
  const backendDir = path.join(__dirname, '..', 'hrmm_backend');
  const py = path.join(__dirname, '..', 'venv', 'Scripts', 'python.exe');
  const cmd = `"${py}" manage.py shell -c "from apps.users.models import User; from apps.authentication.two_factor import get_totp; u=User.objects.get(username='e2e_tester'); print('TOTP:'+get_totp(u.totp_secret))"`;
  const out = execSync(cmd, { cwd: backendDir }).toString();
  const m = out.match(/TOTP:(\d{6})/);
  return m ? m[1] : null;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.request().method()} ${res.url()} -> HTTP ${res.status()}`);
    }
  });

  console.log('== Opening http://localhost:3000 ==');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Login form visible?
  const loginVisible = await page.isVisible('#loginForm');
  console.log('loginForm visible:', loginVisible);

  if (loginVisible) {
    console.log('== Trying login (e2e_tester) ==');
    await page.fill('#loginUsernameInput', 'e2e_tester');
    await page.fill('#loginPasswordInput', 'E2eTest12345');
    await page.click('#loginSubmitButton');
    await page.waitForTimeout(3000);
    const statusText = await page.textContent('#loginStatusBox').catch(() => '');
    console.log('login status:', (statusText || '').trim());
    const twoFactorVisible = await page.isVisible('#loginTwoFactorStep');
    console.log('2FA step visible:', twoFactorVisible);

    if (twoFactorVisible) {
      const code = getTotpCode();
      console.log('== Submitting TOTP code ==');
      await page.fill('#otpCodeInput', code);
      await page.click('#otpSubmitButton');
      await page.waitForTimeout(5000);
      const otpStatus = await page.textContent('#otpStatusBox').catch(() => '');
      console.log('otp status:', (otpStatus || '').trim());
    }

    const appVisible = await page.isVisible('#appView');
    console.log('appView visible:', appVisible);

    if (appVisible) {
      // Navigate a bit inside the app to surface runtime errors
      await page.waitForTimeout(3000);
      const navButtons = await page.$$('.nav-link');
      console.log('nav sections found:', navButtons.length);
      for (const btn of navButtons.slice(0, 12)) {
        const section = (await btn.textContent())?.trim() || (await btn.getAttribute('href'));
        try {
          // Close any open section modal first (it covers the nav)
          const closeBtn = await page.$('#sectionModalClose');
          if (closeBtn && (await closeBtn.isVisible())) {
            await closeBtn.click();
            await page.waitForTimeout(600);
          }
          await btn.click({ timeout: 2000 });
          await page.waitForTimeout(1200);
          console.log('visited section:', section);
        } catch (err) {
          const cls = await btn.getAttribute('class');
          const visible = await btn.isVisible();
          console.log('could not click section:', section, '| class:', cls, '| visible:', visible, '|', String(err).split('\n')[0]);
          await page.screenshot({ path: `e2e_fail_${(section || 'x').replace(/\W+/g, '_')}.png` });
        }
      }
    }
  }

  console.log('\n== Console errors ==');
  consoleErrors.forEach((e) => console.log('  -', e));
  console.log('== Page errors ==');
  pageErrors.forEach((e) => console.log('  -', e));
  console.log('== Failed requests ==');
  failedRequests.forEach((e) => console.log('  -', e));
  console.log(`\nSummary: ${consoleErrors.length} console errors, ${pageErrors.length} page errors, ${failedRequests.length} failed requests`);

  await browser.close();
})();
