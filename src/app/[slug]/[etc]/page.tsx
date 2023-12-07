import { consoler } from '@/_helpers/consoler';
import { AgentData } from '@/_typings/agent';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { Metadata } from 'next';
import { headers } from 'next/headers';

export async function generateMetadata({ params }: { params: { slug: string; etc: string } }): Promise<Metadata> {
  let { etc: html_file_name, slug: agent_id } = params;
  const agent = await findAgentRecordByAgentId(headers().get('x-agent-id') || agent_id);

  if (html_file_name.length > 3) {
    const page_html_path = `https://sites.leagent.com/leagent-webflow-rebuild.webflow.io/${html_file_name}.html`;
    consoler('[slug]/[etc]/page.tsx', { page_html_path });
    if (agent?.id) {
      const { metatags } = agent as unknown as AgentData;
      return {
        title: metatags.title,
        description: metatags.description,
        keywords: metatags.keywords ? metatags.keywords.join(', ') : 'Leagent, Realtor',
      };
    }
  }
  return {
    title: agent_id,
  };
}

export default async function AgentHomePage({ params, searchParams }: { params: { slug: string; etc: string }; searchParams: { [k: string]: string } }) {
  let { etc: html_file_name, slug: agent_id } = params;
  const { theme } = searchParams;
  return (
    <>
      {theme}/{agent_id}
    </>
  );
}
