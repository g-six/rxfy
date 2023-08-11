import { AgentData } from '@/_typings/agent';
import { SlackBlock, SlackElement } from '@/_typings/slack';
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
        value: profile.agent_id || '',
        url: getAgentBaseUrl(profile),
      },
    },
  ];
  if (message) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    });
  }

  const slack_payload = JSON.stringify(
    buildMessage(`A ${profile.agent_id || profile.full_name} has an *update/request*`, blocks, Math.ceil(Date.now() / 1000)),
  );
  const slack_hook = process.env.NEXT_APP_SLACK_WEBHOOK_URL || '';
  if (slack_hook) {
    await fetch(slack_hook, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: slack_payload,
    });
  } else {
    console.log('slack_payload', { slack_payload });
  }
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

  if (ts) payload.ts = ts;
  return payload;
}
