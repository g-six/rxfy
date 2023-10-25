import { AgentData } from '@/_typings/agent';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { Metadata } from 'next';
import PageComponent from './page.module';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const agent = await findAgentRecordByAgentId(params.slug);
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

export default async function AgentHomePage({ params, searchParams }: { params: { slug: string }; searchParams: { [k: string]: string } }) {
  const { slug: agent_id } = params;
  const { theme } = searchParams;

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
