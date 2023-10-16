import { AgentData } from '@/_typings/agent';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';

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
