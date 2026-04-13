const puppeteer = require('puppeteer');
const path = require('path');

const PORT = process.argv[2] || 5173;

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.resolve(__dirname, 'screenshot.png'), fullPage: true });
    await browser.close();
    console.log('Screenshot saved to screenshot.png');
})();
