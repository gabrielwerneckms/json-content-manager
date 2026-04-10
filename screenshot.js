const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const htmlPath = path.resolve(__dirname, 'index.html');
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot.png'), fullPage: true });
    await browser.close();
    console.log('Screenshot saved to screenshot.png');
})();
