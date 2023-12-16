import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import { getAgentBy } from './api/_helpers/agent-helper';
import { consoler } from '@/_helpers/consoler';
import { DOMNode, domToReact } from 'html-react-parser';
import ExternalScriptClient from '@/_data/external-script.client-component';

async function getPageMetadata(): Promise<{ title: string; description: string; html: string; domain_name: string; data?: { [k: string]: any } }> {
  let html = '';
  let domain_name = headers().get('host') || '';
  let title = '';
  let description = 'Leagent';
  let data: { [k: string]: any } = {};
  if (domain_name) {
    const domain = domain_name.split(':').reverse().pop() as string;
    if (domain) {
      domain_name = domain;

      // For dev local machine, strip out .local at the end
      if (domain_name.indexOf('.local') === domain_name.length - 6) {
        domain_name = domain_name.substring(0, domain_name.indexOf('.local'));
      } else if (domain_name.indexOf('.grey') === domain_name.length - 5) {
        domain_name = domain_name.substring(0, domain_name.indexOf('.grey'));
      }
    }
  }
  if (domain_name) {
    data = await getAgentBy({
      domain_name,
    });

    let webflow_domain = data?.webflow_domain || 'leagent-website.webflow.io';

    const url = headers().get('x-pathname');
    const page_url = `https://${data?.webflow_domain}${url}`;
    const page_html_xhr = await fetch(page_url);

    if (page_html_xhr.ok) html = await page_html_xhr.text();
    else {
      // Page does not exist on Webflow
      const page_404_req = await fetch(`https://${data.webflow_domain}/404`);
      if (page_404_req.ok) {
        html = await page_404_req.text();
      }
    }

    if (html) {
      if (data?.webflow_domain) {
        const $: CheerioAPI = load(html);
        title = data.full_name;
        if (data.metatags?.title) title = data.metatags.title;
        if (data.metatags?.description) description = data.metatags.description;
      }
    } else consoler('layout.tsx', page_html_xhr);
  }

  return {
    title,
    description,
    domain_name,
    data,
    html,
  };
}
// export async function generateMetadata({ params }: { params: { [k: string]: any } }): Promise<Metadata> {
//   let { title, description } = await getPageMetadata();

//   return {
//     title,
//     description,
//   };
// }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ts = Date.now();
  const { html } = await getPageMetadata();
  const $: CheerioAPI = load(html);

  consoler('layout.tsx', `${Date.now() - ts}ms`);

  const head = $('head');

  /**
   * Very important!  Webflow's javascript messes with the scripts we create to handle data-context + data-field + data-etc
   * so we only load the script after all our scripts are done loaded
   */
  let jquery: string[] = [];
  $('script[src*=jquery]').each((idx, el) => {
    jquery.push(`<script ${Object.keys(el.attribs).map(attr => `${attr}=${el.attribs[attr]} `)}></script>`);
  });

  $('script[src*=jquery]').remove();
  const scripts = $('body script[src]');
  const webflow_scripts: { [k: string]: string }[] = [];
  scripts.each((i, el) => {
    if (el.attribs.src) webflow_scripts.push(el.attribs);
  });

  const combined =
    '<script type="text/javascript">\n\tfunction loadExternalScripts() {\n\t\tlet script;\n' +
    webflow_scripts
      .map(script => {
        return `

        script = document.createElement('script');
        ${Object.keys(script)
          .map(attr => `script.${attr} = "${script[attr]}";`)
          .join('\n        ')}
        document.body.appendChild(script);`;
      })
      .join('\n') +
    `\n\t}\n\n
    document.addEventListener("external-scripts", loadExternalScripts, false)
    // const origAlert = window.alert 
    const origConsoleLog = window.console.log
    // window.alert = origConsoleLog
    window.console.log = (...message) => {
      if (!Array.isArray(message) || !['tsx', 'ts'].includes(message[0].split('.').pop())) {
        origConsoleLog("Please provide the filename.ts(x) as your first console.log debugging paramater")
        origConsoleLog(" For example: ")
        origConsoleLog("   const a_variable_to_debug_on_console = { foo: 123 };")
        origConsoleLog("   console.log('app/my-page/page.tsx', a_variable_to_debug_on_console)")
        origConsoleLog("   Original arguments to console", message)
      } else {
        origConsoleLog("* * * * * * * * * * * * * * * * *\\n" + "File: "
          + message[0]
          + "\\n\\n"
          + message.slice(1).map(o => {
            if (typeof o === 'object' && Array.isArray(o)) return JSON.stringify(o, null)
            else if (typeof o === 'object' && Object.keys(o).length) return JSON.stringify(o, null, 2)
            else return o
          }).join("\\n\\n------------- * * * -------------\\n\\n")
          + "\\n\\n------------- E N D -------------")
        
      }
    }
    </script>`;

  function loadWebflowScripts() {
    return head.html() + '\n\n' + jquery.join('\n') + '\n\n' + combined;
  }

  return (
    <html suppressHydrationWarning>
      <head dangerouslySetInnerHTML={{ __html: loadWebflowScripts() || '' }} suppressHydrationWarning />
      <body suppressHydrationWarning>
        {children}
        <ExternalScriptClient />
      </body>
    </html>
  );
}
