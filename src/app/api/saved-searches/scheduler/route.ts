import type { NextRequest } from 'next/server';
import { getNextFiveToEmail, getTopListings, updateSavedSearch } from '../model';
import { consoler } from '@/_helpers/consoler';
import { SavedSearchInput, SavedSearchOutput } from '@/_typings/saved-search';
import { sendTemplate } from '../../send-template';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { findAgentRecordByAgentId } from '../../agents/model';
import { getAgentBaseUrl } from '../../_helpers/agent-helper';
import { createSession } from '../../log-in/subroutines';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';

const FILE = 'saved-searches/scheduler/route.ts';

export async function GET(req: NextRequest) {
  const records = await getNextFiveToEmail();
  let senders: {
    [k: string]: AgentData;
  } = {};
  if (records.length) {
    const last_email_at = new Date().toISOString();
    const sent: number[] = [];
    const notifications = await Promise.all(
      records.map(async (saved_search: { [k: string]: any }) => {
        const session = await createSession(saved_search.customer.data.id);
        let agent_logo_url = getImageSized('https://leagent.com/logo-dark.svg', 300);
        if (saved_search.agent?.agent_id) {
          if (senders[saved_search.agent.agent_id] === undefined) {
            const agent: AgentData = await findAgentRecordByAgentId(saved_search.agent.agent_id);
            senders = {
              ...senders,
              [saved_search.agent.agent_id]: agent,
            };
          }
        }

        const send_to = {
          email: saved_search.customer?.data?.attributes.email,
          name: saved_search.customer?.data?.attributes.full_name,
        };

        const properties = await getTopListings(saved_search as SavedSearchInput);
        if (senders[saved_search.agent.agent_id]) {
          const { logo_for_dark_bg, logo_for_light_bg } = senders[saved_search.agent.agent_id].metatags;
          const email_contents = {
            send_to_name: send_to.name,
            website_url: getAgentBaseUrl(senders[saved_search.agent.agent_id], true),
            unsubscribe_url: getAgentBaseUrl(senders[saved_search.agent.agent_id], true) + `/my-home-alerts?unsub=${saved_search.id}`,
            agent_logo_url: logo_for_light_bg || logo_for_dark_bg ? getImageSized(`${logo_for_light_bg || logo_for_dark_bg}`, 150) : agent_logo_url,
          };

          await sendTemplate('saved-search', [send_to], {
            properties: properties.map((p: PropertyDataModel) => ({
              ...p,
              property_url: getAgentBaseUrl(senders[saved_search.agent.agent_id], true) + `/property?mls=${p.mls_id}&ref=my-home-alerts`,
            })) as unknown as string,
            ...email_contents,
          });

          // sent.push(saved_search.id);
        }
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
