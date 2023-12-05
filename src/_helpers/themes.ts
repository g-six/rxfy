import { consoler } from './consoler';

export function getThemeDomainHostname(host: string) {
  if (['alicante', 'hamburg', 'lisbon', 'malaga', 'malta', 'oslo'].includes(`${host.split('.').reverse().pop()}`)) {
    consoler('_helpers/themes.ts: getThemeDomainHostname', 'Theme subdomain:', host.split('.').reverse().pop());
    return `${host.split('.').reverse().pop()}.leagent.com`;
  }
  if (host.includes('leagent.com')) {
    // Sales site or tema dela madré
    return host.split('.').reverse().pop() === 'leagent' ? 'leagent.com' : 'app.leagent.com';
  }
  const custom = host.split('.local').join('');
  return custom === 'localhost' ? 'leagent.com' : custom;
}

export function getWebflowDomain(host: string) {
  if (['alicante', 'hamburg', 'lisbon', 'malaga', 'malta', 'oslo'].includes(`${host.split('.').reverse().pop()}`)) {
    consoler('_helpers/themes.ts: getWebflowDomain', 'Theme subdomain:', host.split('.').reverse().pop());
    return `${host.split('.').reverse().pop()}-leagent.webflow.io`;
  }
  if (host.includes('leagent.com')) {
    // Sales site or tema dela madré
    return host.split('.').reverse().pop() === 'leagent' ? 'leagent-website.webflow.io' : 'leagent-webflow-rebuild.webflow.io';
  }

  // If all else fails, assume that the site has its own custom premium webflow theme
}
