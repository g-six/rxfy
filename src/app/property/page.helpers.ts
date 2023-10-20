import { CheerioAPI } from 'cheerio';
import { headers } from 'next/headers';

export function replaceAgentFields($: CheerioAPI) {
  if ($('img[data-field="headshot"]')) {
    const src = headers().get('x-agent-headshot');
    if (src) {
      $('img[data-field="headshot"]').each((i, img_element) => {
        $(img_element).removeAttr('srcset');
        $(img_element).attr('src', src);
        // $(img_element).replaceWith(`${$(img_element).toString()}`.split($(img_element).attr('src') as string).join(src));
      });
    }
  }
  $('[data-field="agent_name"]').html(headers().get('x-agent-name') as string);
  if (headers().get('x-agent-email')) {
    $('[data-field="email"]').html(headers().get('x-agent-email') as string);
    $('[data-field="email"]')
      .parent('a')
      .attr('href', `mailto:${headers().get('x-agent-email') as string}`);
  }
  if (headers().get('x-agent-phone')) {
    $('[data-field="phone"]').html(headers().get('x-agent-phone') as string);
    $('[data-field="phone"]')
      .parent('a')
      .attr('href', `tel:${headers().get('x-agent-phone') as string}`);
  } else $('[data-field="phone"]').remove();
}
