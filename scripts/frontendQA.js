import { chromium } from 'k6/experimental/browser';
import { sleep, check } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let errorRate = new Rate("errors");
const myTrend = new Trend("my_trend");

export function handleSummary(data) {
    return {
        "./reports/html/result.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

export const options = {
    // Key configurations for test in this section
    stages: [
      { duration: '3s', target: 3 }, 
    ],
};

export default async function () {
    const timestamp = new Date().getTime();
    const browser = chromium.launch(
        {
            headless: true,
            timeout: '35s'
        }
    );
    const page = browser.newPage();
    const uri = 'https://test.k6.io/my_messages.php';
    try {
        await page.goto(uri, { waitUntil: 'load' });
        await page.waitForSelector('input[name="login"]');
        await page.waitForSelector('input[name="password"]');
        await page.waitForSelector('input[type="submit"]');
        await page.locator('input[name="login"]').type('admin');
        await page.locator('input[name="password"]').type('123');
        const button = page.locator('input[type="submit"]');
        await Promise.all([page.waitForNavigation(), button.click()]);
        await page.waitForSelector('h2');
        let checkRes = check(page, {
            userLogged: page.locator('h2').textContent() == 'Welcome, admin!',
        });
        if (checkRes) {
            errorRate.add(0);
            page.screenshot({
                path: `./reports/screenshots/success_screenshot_${timestamp}.png`,
            });
        } else {
            errorRate.add(1);
            console.log('Error Check');
            page.screenshot({
                path: `./reports/screenshots/error_screenshot_${timestamp}.png`,
            });
        }
    } finally {
        page.close();
        browser.close();
    }
}