import QR from 'qrcode';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { LISTING_FEETERS_FIELDS, LISTING_MONEY_FIELDS, LISTING_NUMERIC_FIELDS } from '@/_utilities/data-helpers/listings-helper';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import puppeteer, { PaperFormat } from 'puppeteer';
import { AgentData } from '@/_typings/agent';

export async function getPdf(page_url: string, data: unknown) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const { data: html_data } = await axios.get(page_url);
  const $: CheerioAPI = load(html_data);
  let values = data as { [key: string]: string };

  Object.keys(values).forEach(key => {
    if (LISTING_MONEY_FIELDS.includes(key))
      values = {
        ...values,
        [key]: `$${new Intl.NumberFormat(undefined).format(Number(values[key]))}`,
      };
    else if (key === 'description' && values[key].length > 720) {
      const sentences = values[key].split('. ');
      values = {
        ...values,
        [key]: sentences[0],
      };
      sentences.slice(1).forEach(sentence => {
        if (values[key].length + sentence.length < 720) {
          values = {
            ...values,
            [key]: `${values[key] + '. ' + sentence}`,
          };
        }
      });
      values = {
        ...values,
        [key]: values[key],
      };
    } else if (key === 'dwelling_type') {
      const { name } = values[key] as unknown as {
        name: string;
      };
      values = {
        ...values,
        [key]: name,
      };
    } else if (key === 'lot_area' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(v)} ${values.lot_uom}`,
        };
      }
    } else if (key === 'lot_sqft' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(values[key] as unknown as number)} sqft`,
        };
      }
    } else if (key === 'lot_sqm' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(values[key] as unknown as number)} sqm`,
        };
      }
    } else if (LISTING_NUMERIC_FIELDS.includes(key)) {
      values[key] = new Intl.NumberFormat().format(Number(values[key]));
      if (key.indexOf('floor_area') === 0 && values.floor_area_uom === 'Feet') {
        values[key] = values[key] + ' Sqft';
      } else {
        values[key] = values[key] + ' Sqm';
      }
    } else if (LISTING_FEETERS_FIELDS.includes(key)) {
      values[key] = new Intl.NumberFormat().format(Number(values[key])) + 'sqft';
    } else if (key === 'agent') {
      const agent = values[key] as unknown as { [key: string]: unknown };
      Object.keys(agent).forEach(agent_field => {
        if (agent_field === 'metatags') {
          const metatags = agent[agent_field] as { [key: string]: unknown };
          Object.keys(metatags).forEach(mtag => {
            if (typeof metatags[mtag] === 'string') {
              values = {
                ...values,
                [`agent.metatags.${mtag}`]: metatags[mtag] as string,
              };
            }
          });
        } else if (typeof agent[agent_field] === 'string') {
          values = {
            ...values,
            [`${key}.${agent_field}`]: agent[agent_field] as string,
          };
        }
      });
    } else if (typeof values[key] === 'object') {
      const { legal_disclaimer } = values[key] as unknown as {
        [key: string]: string;
      };

      if (key === 'real_estate_board' && legal_disclaimer) {
        values = {
          ...values,
          'real_estate_board.legal_disclaimer': legal_disclaimer,
        };
      }
    }
  });

  values = {
    ...values,
    map:
      values.lon && values.lat
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${values.lon},${values.lat},13,0,60/580x200@2x?access_token=${process.env.NEXT_APP_MAPBOX_TOKEN}`
        : '',
  };

  $('[data-field="map"]').replaceWith(
    `<div style="background-image: url(${values.map}); background-position: center; background-size: cover;" class="${$('[data-field="map"]').attr(
      'class',
    )}"></div>`,
  );
  const { photos } = values as unknown as { photos: string[] };
  photos &&
    photos.length > 1 &&
    photos.slice(1).forEach((url, idx) => {
      $(`.b-images:nth-child(${idx + 1})`).replaceWith(
        `<div style="background-image: url(${getImageSized(url, 320)}); background-position: center; background-size: cover;" class="${$(
          `.b-images:nth-child(${idx + 1})`,
        ).attr('class')} filled"></div>`,
      );
    });

  $('[data-image="cover_photo"]').replaceWith(
    `<div style="background-image: url(${getImageSized(values.photos[0], 600)}); background-position: center; background-size: cover;" class="${$(
      '[data-image="cover_photo"]',
    ).attr('class')}"></div>`,
  );

  const headshot_replacement = values['agent.metatags.headshot'] ? getImageSized(values['agent.metatags.headshot'], 200) : getImageSized(values.photos[0], 200);
  $('[data-image="agent.metatags.headshot"]').replaceWith(
    `<div style="background-image: url(${headshot_replacement}); background-position: center; background-size: cover;" class="${$(
      '[data-image="agent.metatags.headshot"]',
    ).attr('class')}"></div>`,
  );

  const logo_replacement = values['agent.metatags.headshot']
    ? getImageSized(values['agent.metatags.logo_for_light_bg'], 200)
    : getImageSized(values.photos[0], 200);
  $('[data-image="agent.metatags.logo_for_light_bg"]').replaceWith(
    `<img class="${$('[data-image="agent.metatags.logo_for_light_bg"]').attr('class')}" src="${logo_replacement}"></div>`,
  );

  const { agent } = values as unknown as {
    agent: AgentData;
  };
  if (agent.agent_id && agent.metatags.profile_slug) {
    const qr = await QR.toDataURL(`https://leagent.com/${agent.agent_id}/${agent.metatags.profile_slug}`);
    $('[data-image="qr"]').replaceWith(`<img src="${qr}" width="100" height="100" />`);
  }

  await page.setContent($.html());
  //   await page.goto(page_url, { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.fonts.ready');
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.emulateMediaType('screen');

  await page.evaluate(
    ([d]) => {
      document.querySelectorAll('[data-field]').forEach(el => {
        if (el.getAttribute('data-field')) {
          const field = el.getAttribute('data-field');
          if (field && d[field]) {
            if (field === 'map') {
              el.setAttribute('style', `background: url(${d[field]}) no-repeat cover center;`);
            } else el.innerHTML = d[field];
          } else {
            console.log(field, 'field not available');
          }
        }
      });
      document.querySelectorAll('[data-stats]').forEach(el => {
        if (el.getAttribute('data-stats')) {
          const field = el.getAttribute('data-stats');
          if (field) {
            let v = d[field];
            if (field === 'frontage' && !v) {
              if (d.frontage_feet) v = new Intl.NumberFormat().format(Number(d.frontage_feet)) + 'sqft';
              if (d.frontage_metres) v = new Intl.NumberFormat().format(Number(d.frontage_metres)) + 'sqm';
            }
            if (v) {
              (el.querySelector('.field-value') as Element).innerHTML = v;
            } else el.remove();
          } else el.remove();
        }
      });
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href') as string;
        if (href.indexOf('webflow') >= 0) {
          el.remove();
        }
      });
    },
    [values],
  );

  // console.log(property);
  // dom.forEach(el => {
  // });

  // await page.evaluateHandle('document.fonts.ready');
  const format: PaperFormat = 'LETTER';
  const pdf = await page.pdf({
    path: 'result.pdf',
    margin: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
    printBackground: true,
    format,
  });

  await browser.close();

  return pdf;
}
