import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(req: NextRequest, { params }: { params: { agent_id: string; profile_slug: string } }) {
  const { origin, pathname } = new URL(req.url);

  if (origin) {
    const browserWSEndpoint = `wss://chrome.browserless.io?token=${process.env.NEXT_APP_BROWSERLESS_TOKEN}`;
    const browser = await puppeteer.connect({ browserWSEndpoint });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1280 });
    await page.goto(`https://leagent.com/${params.agent_id}/${params.profile_slug}?theme=oslo`);
    // const response = await getPdf(page_url, full_data as unknown);
    const screenshot = await page.screenshot({ type: 'jpeg', fullPage: true, quality: 80 });
    return getResponse({ body: screenshot }, 200, 'image/jpeg');
  }

  return getResponse({ error: 'Unable to fetch website' }, 400);
}
