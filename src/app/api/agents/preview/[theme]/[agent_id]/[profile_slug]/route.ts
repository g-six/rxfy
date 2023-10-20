import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
// import puppeteer from 'puppeteer';

export async function GET(req: NextRequest, { params }: { params: { theme: string; agent_id: string; profile_slug: string } }) {
  const { origin, searchParams } = new URL(req.url);

  if (origin) {
    // const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    // const page = await browser.newPage();
    // await page.setViewport({ width: 1440, height: 1280 });
    const mls_id = searchParams.get('mls');
    // const url = `https://leagent.com/${params.agent_id}/${params.profile_slug}${mls_id ? `/property?mls=${mls_id}` : ''}${
    //   params.theme !== 'default' ? `?theme=${params.theme}` : ''
    // }`;
    const url = `leagent.com/${params.agent_id}/${params.profile_slug}${mls_id ? `/property?mls=${mls_id}&preview=1` : '?'}${
      params.theme !== 'default' ? `theme=${params.theme}&preview=1` : 'preview=1'
    }`;
    console.log(url);
    const image = await fetch(`https://cloudcapture.cc/api/grab?url=${url}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `API_KEY ${process.env.NEXT_APP_CLOUDCAPTURE_API_KEY}`,
      },
    });
    return image;
    // await page.goto(url);
    // const screenshot = await page.screenshot({ type: 'jpeg', fullPage: true, quality: 80 });
    // return getResponse({ body: image }, 200, 'image/jpeg');
  }

  return getResponse({ error: 'Unable to fetch website' }, 400);
}
