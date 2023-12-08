import { AgentData } from '@/_typings/agent';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { NextResponse, NextRequest } from 'next/server';
import { consoler } from './consoler';
import { objectToQueryString, queryStringToObject } from '@/_utilities/url-helper';

const FILE = '_helpers/head-manipulations.ts';
export function replaceMetaTags(headCode: string, agent: AgentData, property?: object) {
  if (!agent || !agent.metatags) return headCode;
  const prop = property as PropertyDataModel & { photos?: string[] };
  if (headCode.length) {
    // fields to place
    let title = agent.full_name;
    let description = agent.metatags.personal_bio;

    if (prop) {
      // If there's a property model
      const title_segments = [];
      if (prop.asking_price) {
        title_segments.push(getShortPrice(prop.asking_price));
      }
      if (prop.beds) {
        title_segments.push(`${prop.beds} Beds`);
      }
      if (prop.baths) {
        title_segments.push(`${prop.baths} Baths`);
      }
      if (prop.title) {
        title_segments.push(prop.title);
      }

      title = title_segments.join(' | ');

      description = prop.description;
    }

    let image;
    if (prop) {
      const [photo] = (prop.photos || []) as unknown as string[];
      image = photo;
    } else {
      image = image ? image : agent.metatags.logo_for_light_bg;
      image = agent.metatags.logo_for_dark_bg;
      image = image ? image : agent.metatags.profile_image;
    }

    const replacers = [];
    if (description) {
      replacers.push({
        regex: /<meta name="description" content="(.*)">/,
        data: `<meta name="description" content="${description}">`,
      });
    }

    if (image) {
      replacers.push({
        regex: /<meta property="og:image" content="[^"]*"[^>]*>/gi,
        data: `<meta property="og:image" content="${image}">`,
      });
    }
    if (agent.metatags.favicon) {
      headCode = headCode.split('https://assets-global.website-files.com/img/favicon.ico').join(agent.metatags.favicon);
    }

    replacers.forEach(replacer => {
      if (replacer.regex.test(headCode)) {
        // If the description meta tag already exists, replace it with the new value
        headCode = headCode.replaceAll(replacer.regex, replacer.data);
      } else {
        // If the description meta tag does not exist, add it to the head section
        const headEndTagIndex = headCode.indexOf('</head>') + 1;
        headCode = [headCode.slice(0, headEndTagIndex), replacer.data, headCode.slice(headEndTagIndex)].join('');
      }
    });
  }
  return headCode;
}

export function setAgentWebsiteHeaders(agent_data: AgentData, request: NextRequest, response: NextResponse) {
  response.headers.set('x-record-id', `${agent_data.id}`);
  response.headers.set('x-agent-id', agent_data.agent_id);
  response.headers.set('x-agent-name', agent_data.full_name);
  response.headers.set('x-agent-email', agent_data.email);
  response.headers.set('x-agent-phone', agent_data.phone);
  response.headers.set('x-website-theme', agent_data.website_theme || 'default');
  response.cookies.set('session_as', 'customer');
  const webflow_domain =
    agent_data.webflow_domain || `${agent_data.website_theme ? agent_data.website_theme + '-leagent' : 'leagent-webflow-rebuild'}.webflow.io`;
  response.headers.set('x-wf-domain', webflow_domain);

  if (agent_data.domain_name) {
    response.headers.set('x-agent-domain-name', agent_data.domain_name);
  }

  const { pathname, origin, search: q, searchParams } = new URL(request.url);
  let filename = pathname.split('/').pop() || 'index';
  if (filename.indexOf(agent_data.agent_id) === 0) {
    const [, page] = filename.split('/');
    if (!page) filename = 'index';
    else {
      switch (page) {
        default:
          filename = page;
      }
    }
  }
  filename = filename.includes('?') ? (filename.split('?').reverse().pop() as string) : filename;
  filename = filename || 'index';
  if (filename === 'property') {
    response.headers.set(
      'x-canonical',
      'https://' + agent_data.domain_name || `${agent_data.website_theme ? agent_data.website_theme : 'app'}.leagent.com/${filename}?mls=x`,
    );
    response.headers.set('x-url', `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/property/propertyid.html`);
  } else if (filename === 'map') {
    response.headers.set(
      'x-canonical',
      'https://' +
        (agent_data.domain_name || `${agent_data.website_theme ? agent_data.website_theme : 'app'}.leagent.com`) +
        (agent_data.domain_name ? '' : `/${agent_data.agent_id}`) +
        `/map?${objectToQueryString((agent_data?.metatags?.geocoding || {}) as unknown as { [k: string]: string })}&beds=0&baths=0`,
    );
    response.headers.set('x-url', `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/map.html`);
  } else {
    // If the /first-segment/of-this-path satisfies first-segment === agent_id
    if (pathname.substring(1).toLowerCase().indexOf(agent_data.agent_id.toLowerCase()) === 0) {
      response.headers.set(
        'x-canonical',
        'https://' +
          (agent_data.domain_name || `${agent_data.website_theme ? agent_data.website_theme : 'app'}.leagent.com`) +
          (agent_data.domain_name ? '' : `/${agent_data.agent_id}`) +
          `/${pathname.substring(1).toLowerCase() !== agent_data.agent_id.toLowerCase() ? pathname.substring(1).split('/').slice(1).join('/') : ''}`,
      );

      response.headers.set(
        'x-url',
        `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${pathname.substring(1).split('/').slice(1).join('/') || 'index'}.html`,
      );
    } else {
      if (agent_data.domain_name) {
        response.headers.set(
          'x-url',
          `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${pathname !== '/' ? pathname.substring(1) : 'index'}.html`,
        );
      } else
        response.headers.set(
          'x-url',
          `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${
            pathname !== '/' ? pathname.substring(1).split('/').slice(1).join('/') : 'index'
          }.html`,
        );

      response.headers.set(
        'x-canonical',
        'https://' + agent_data.domain_name || `${agent_data.website_theme ? agent_data.website_theme : 'app'}.leagent.com${pathname}`,
      );
    }
  }

  if (agent_data.metatags) {
    const {
      id: metatag_id,
      title,
      description,
      profile_slug,
      logo_for_dark_bg,
      logo_for_light_bg,
      facebook_url,
      linkedin_url,
      youtube_url,
      instagram_url,
    } = agent_data.metatags as unknown as { [k: string]: string };
    response.headers.set('x-metatag-id', metatag_id);
    response.headers.set('x-page-title', `${title || 'Leagent'}`);
    try {
      response.headers.set('x-page-description', description.split('•').join(''));
    } catch (e) {
      consoler(FILE, 'Unable to set x-page-description header');
    }
    response.headers.set('x-profile-slug', profile_slug);
    response.headers.set('x-dark-bg-logo', logo_for_dark_bg || '');
    response.headers.set('x-light-bg-logo', logo_for_light_bg || '');
    response.headers.set('x-facebook-url', facebook_url || '');
    response.headers.set('x-linkedin-url', linkedin_url || '');
    response.headers.set('x-youtube-url', youtube_url || '');
    response.headers.set('x-instagram-url', instagram_url || '');
    if (agent_data.metatags.headshot) response.headers.set('x-agent-headshot', agent_data.metatags.headshot);
    if (agent_data.metatags.geocoding) {
      let { lat, lng, ...geocoding } = agent_data.metatags.geocoding as unknown as { [k: string]: number } & { lat: number; lng: number };
      if (!lat && agent_data.metatags.lat) lat = agent_data.metatags.lat;
      if (!lng && agent_data.metatags.lng) lng = agent_data.metatags.lng;
      const map_search_params = objectToQueryString({
        ...geocoding,
        lat,
        lng,
      });
      response.headers.set('x-search-params', map_search_params);
      const map_uri = `${agent_data.domain_name ? '' : `/${webflow_domain.includes('leagent') ? agent_data.agent_id : ''}`}/map?${map_search_params}`;
      response.headers.set('x-map-uri', map_uri);
      if (filename === 'map' && (!searchParams.get('lng') || !searchParams.get('lat'))) {
        return NextResponse.redirect(
          `${origin}/${!agent_data.domain_name ? `${agent_data.agent_id}/` : ''}map?${objectToQueryString(
            agent_data.metatags.geocoding as unknown as {},
          )}&baths=0&beds=0`,
        );
      }
    }
  } else {
    consoler(FILE, 'DEBUG head-manipulations', 'WARNING!', 'No agent metatag found');
  }

  return response;
}
