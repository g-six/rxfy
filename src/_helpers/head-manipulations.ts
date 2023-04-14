import { AgentData } from '@/_typings/agent';
import { MLSProperty } from '@/_typings/property';

export function replaceMetaTags(headCode: string, agent: AgentData, property?: object) {
  const prop = property as MLSProperty;
  if (headCode.length) {
    // fields to place
    const title = prop ? prop.Address : agent.full_name;
    const description = prop ? prop.Remarks : agent.metatags.personal_bio;
    let image;
    if (prop) {
      const [photo] = (prop.photos || []) as unknown as string[];
      image = photo;
    } else {
      image = image ? image : agent.metatags.logo_for_light_bg;
      image = agent.metatags.logo_for_dark_bg;
      image = image ? image : agent.metatags.profile_image;
    }

    const replacers = [
      {
        regex: /<title>[^<]*<\/title>/gi,
        data: `<title>${title}</title>`,
      },
    ];
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
