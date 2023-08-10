import { AgentData } from '@/_typings/agent';
import { SlackBlock } from '@/_typings/slack';

export async function notifySlack(profile: AgentData, message: string) {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: [`*Name:*\n${profile.full_name} <${profile.email}>`].join('\n\n'),
        },
        {
          type: 'mrkdwn',
          text: [`*Email:*\n${profile.user.email}`, `*Phone:*\n${profile.user.phone_number}`].join('\n\n'),
        },
      ],
    },
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
        value: profile.profile_slug,
        url: `${process.env.LEAGENT_APP_URL}/p/${profile.profile_slug}`,
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
