import { AgentData } from '@/_typings/agent';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { Metadata } from 'next';
import PageComponent from './page.module';
import { headers } from 'next/headers';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const agent = await findAgentRecordByAgentId(headers().get('x-agent-id') || params.slug);
  if (agent.id) {
    const { metatags } = agent as unknown as AgentData;
    return {
      title: metatags.title,
      description: metatags.description,
      keywords: metatags.keywords ? metatags.keywords.join(', ') : 'Leagent, Realtor',
    };
  }
  return {
    title: params.slug,
  };
}

export default async function AgentHomePage({
  params,
  searchParams,
}: {
  params: { slug: string; 'profile-slug': string };
  searchParams: { [k: string]: string };
}) {
  let { slug: agent_id } = params;
  const { theme } = searchParams;
  return <>{agent_id}</>;
  if (agent_id) {
    return (
      <>
        <PageComponent theme={theme} agent_id={agent_id} />
      </>
    );
  }
  return <></>;
}

// export default DefaultPage;
