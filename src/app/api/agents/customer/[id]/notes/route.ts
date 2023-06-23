import { getResponse } from '@/app/api/response-helper';
import axios from 'axios';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
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
  const agent = await checkSession(request);

  const { id: realtor, customers } = agent as unknown as {
    id: number;
    customers: { notes: string[]; id: number }[];
  };
  const [customer] = customers.filter(c => c.id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

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
