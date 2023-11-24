import { AgentData } from '@/_typings/agent';
import { getUserSessionData, isRealtorRequest } from '@/app/api/check-session/model';
import { getResponse } from '@/app/api/response-helper';
import axios from 'axios';
import { NextRequest } from 'next/server';
const mutation_add_notes = `mutation AddNotes ($data: NoteInput!) {
    createNote(data: $data) {
      data {
        id
        attributes {
          body
        }
      }
    }
}`;

export async function POST(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/notes')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const user_type = isRealtorRequest(request.url) ? 'realtor' : 'customer';
  const authorization = request.headers.get('authorization') || '';
  const agent = await getUserSessionData(authorization, user_type);

  const { id: realtor, customers } = agent as AgentData;
  if (customers) {
    const [customer] = customers.filter(c => c.agent_customer_id === agents_customer_id);

    if (customer) {
      let notes = '';
      try {
        const payload = await request.json();
        notes = payload.notes;
      } catch (e) {
        return getResponse({
          error: 'Unable to detect valid JSON',
        });
      }

      if (!notes) {
        return getResponse({
          error: 'Please provide the notes',
        });
      }

      const { data: response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: mutation_add_notes,
          variables: {
            data: { agents_customer: agents_customer_id, body: notes, realtor },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response?.data?.createNote?.data?.id) {
        const {
          id,
          attributes: { body },
        } = response.data.createNote.data;
        return getResponse({
          id: Number(id),
          body,
        });
      }
    }
  }

  return getResponse({
    error: 'Please provide a valid customer relationship id',
  });
}
