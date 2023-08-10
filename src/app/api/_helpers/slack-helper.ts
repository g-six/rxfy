import { AgentData } from '@/_typings/agent';
import { SlackBlock } from '@/_typings/slack';
import { getAgentBaseUrl } from './agent-helper';

export async function notifySlack(profile: AgentData, message: string) {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ' ',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Profile :arrow_upper_right:',
          emoji: true,
        },
        value: profile.metatags?.profile_slug || '',
        url: getAgentBaseUrl(profile),
      },
    },
  ];

  const slack_payload = JSON.stringify(buildMessage(`A ${profile.user.user_type} has *updated* their *Leagent* plan`, blocks, plan.created));
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: slack_payload,
  });
}

export function buildMessage(message: string, contents: SlackBlock[], ts?: number): { blocks: SlackBlock[] } {
  let elements: SlackElement[] = [
    {
      type: 'image',
      image_url: 'https://leagent.com/favicon.png',
      alt_text: 'LEAGENT',
    },
  ];

  if (ts) {
    elements.push({ type: 'mrkdwn', text: new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(ts * 1000)) });
  }

  elements = elements.concat([
    {
      type: 'mrkdwn',
      text: message,
    },
  ]);

  let blocks: SlackBlock[] = [
    {
      type: 'context',
      elements,
    },
    {
      type: 'divider',
    },
  ];

  if (contents.length) blocks = blocks.concat(contents);

  const payload: { blocks: SlackBlock[]; ts?: number } = {
    blocks,
  };
  console.log(JSON.stringify(blocks, null, 2));
  if (ts) payload.ts = ts;
  return payload;
}
