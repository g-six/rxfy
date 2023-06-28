import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest) {
  let screenshotBase64 = '';
  const { origin, searchParams, pathname } = new URL(req.url);

  const lid = pathname.split('/').reverse().slice(1, 2).pop();
  if (origin && searchParams.get('agent') && searchParams.get('slug') && !isNaN(Number(lid))) {
    const page_url = [origin, searchParams.get('agent'), searchParams.get('slug'), 'property'].join('/') + `?lid=${lid}`;
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 960 });

    await page.goto(page_url);
    await page.waitForNetworkIdle();
    screenshotBase64 = await page.screenshot({
      encoding: 'base64',
      fullPage: true,
    });

    await browser.close();
  }

  return screenshotBase64
    ? getResponse(
        {
          body: `<img src="data:image/png;base64,${screenshotBase64}" alt="image" />`,
        },
        200,
        'text/html',
      )
    : getResponse({ error: 'Unable to fetch preview' }, 400);
}
