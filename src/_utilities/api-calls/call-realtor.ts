import { AgentData } from '@/_typings/agent';
import { BrokerageInput } from '@/_typings/brokerage';
import { SearchHighlightInput } from '@/_typings/maps';
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

export async function createAgentRecord(record: {
  agent_id: string;
  email: string;
  phone: string;
  full_name: string;
  target_city: SearchHighlightInput;
  neighbourhoods?: SearchHighlightInput[];
}) {
  const xhr = await axios.post('/api/new-agent', record);
  let agent: AgentData | undefined = xhr.data || {};
  return agent;
}

export async function addCustomerNote(agent_customer_id: number, notes: string) {
  const xhr = await axios.post(
    `/api/agents/customer/${agent_customer_id}/notes`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
      },
    },
  );
  return xhr.data || {};
}

export async function updateCustomerNote(id: number, notes: string) {
  const xhr = await axios.put(
    `/api/agents/customer/notes/${id}`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${Cookies.get('session_key')}`,
      },
    },
  );
  return xhr.data || {};
}

export async function sendMessageToRealtor(info: {
  email?: string;
  customer_name: string;
  phone: string;
  message: string;
  send_to: {
    email: string;
    name: string;
  };
  host?: string;
}) {
  const response = await axios.post('/api/agents/contact', info, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}
