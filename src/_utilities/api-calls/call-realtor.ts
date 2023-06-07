import { AgentData } from '@/_typings/agent';
import axios from 'axios';

export async function getAgentByParagonId(agent_id: string) {
  const xhr = await axios.get('/api/agents/agent-id/' + agent_id);
  let agent: AgentData | undefined = undefined;
  if (xhr?.data) {
    agent = {
      ...xhr.data.attributes,
      id: Number(xhr.data.id),
    };
  }
  return agent;
}
