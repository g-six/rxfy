import type { NextRequest } from 'next/server';
import { getNextFiveToEmail, getTopListings, updateSavedSearch } from '../model';
import { consoler } from '@/_helpers/consoler';
import { SavedSearchInput, SavedSearchOutput } from '@/_typings/saved-search';
import { sendTemplate } from '../../send-template';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { findAgentRecordByAgentId } from '../../agents/model';
import { getAgentBaseUrl } from '../../_helpers/agent-helper';
import { createSession } from '../../log-in/subroutines';

const FILE = 'saved-searches/scheduler/route.ts';

export async function GET(req: NextRequest) {
  const records = await getNextFiveToEmail();
  let senders: {
    [k: string]: {
      agent_logo_url: string;
      website_url: string;
    };
  } = {};
  if (records.length) {
    const last_email_at = new Date().toISOString();
    const sent: number[] = [];
    const notifications = await Promise.all(
      records.map(async (saved_search: { [k: string]: any }) => {
        const properties = await getTopListings(saved_search as SavedSearchInput);
        const session = await createSession(saved_search.customer.data.id);
        let agent_logo_url = getImageSized('https://leagent.com/logo-dark.svg', 300);
        if (saved_search.agent?.agent_id) {
          const agent = await findAgentRecordByAgentId(saved_search.agent.agent_id);
          if (agent?.agent_id && senders[saved_search.agent.agent_id] === undefined) {
            senders = {
              ...senders,
              [saved_search.agent.agent_id]: {
                website_url: `${getAgentBaseUrl(agent)}/${session ? `my-profile?key=${session.session_key}&as=customer` : 'log-in'}`,
                agent_logo_url: saved_search.agent.logo_for_light_bg || saved_search.agent.logo_for_dark_bg,
              },
            };
          }
        }
        const send_to = {
          email: saved_search.customer?.data?.attributes.email,
          name: saved_search.customer?.data?.attributes.full_name,
        };

        const email_contents = {
          send_to_name: send_to.name,
          website_url: senders[saved_search.agent.agent_id].website_url,
          agent_logo_url: senders[saved_search.agent.agent_id].agent_logo_url
            ? getImageSized(senders[saved_search.agent.agent_id].agent_logo_url, 150)
            : agent_logo_url,
        };

        await sendTemplate('saved-search', [send_to], {
          properties,
          ...email_contents,
        });

        sent.push(saved_search.id);
        return {
          send_to,
          properties,
        };
      }),
    );

    const updates = await Promise.all(
      sent.map(async id => {
        const { data: update_response } = await updateSavedSearch(id, { last_email_at });
        consoler(FILE, { update_response });
        return update_response.data;
      }),
    );

    return Response.json({
      updates,
      ok: true,
    });
  }
  return Response.json({ records, ok: true });
}
