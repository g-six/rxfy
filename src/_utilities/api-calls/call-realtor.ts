import { AgentData } from '@/_typings/agent';
import { BrokerageDataModel, BrokerageInput } from '@/_typings/brokerage';
import axios from 'axios';
import Cookies from 'js-cookie';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${Cookies.get('session_key')}`,
};
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

export async function updateBrokerageInformation(data: BrokerageInput & { id?: number }) {
  const xhr = await axios.put(`/api/agents/update-account/brokerage${data.id ? `/${data.id}` : ''}`, data, {
    headers,
  });
  if (xhr?.data) {
    return xhr.data;
  }
  return data;
}
