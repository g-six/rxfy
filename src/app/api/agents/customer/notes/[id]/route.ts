import { getResponse } from '@/app/api/response-helper';
import axios from 'axios';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
const mutation_add_notes = `mutation AddNotes ($agents_customer_id: ID!, $body: String!) {
    createNote(data: { agents_customer: $agents_customer_id, body: $body }) {
      data {
        id
        attributes {
          body
        }
      }
    }
}`;
const mutation_update_notes = `mutation UpdateNotes ($id: ID!, $body: String!) {
    updateNote(id: $id, data: { body: $body }) {
      data {
        id
        attributes {
          body
        }
      }
    }
}`;

export async function PUT(request: NextRequest) {
  const notes_id = Number(request.url.split('/').pop());
  if (isNaN(notes_id)) {
    return getResponse({
      error: 'Please provide a valid notes id',
    });
  }
  const agent = await checkSession(request, { config: { internal: 'yes' } });

  const { id: realtor, customers } = agent as unknown as {
    id: number;
    customers: { notes: { id: number; body: string; realtor: number }[]; id: number }[];
  };

  // Get the notes tied to this customer to make sure that the editor is
  // the owner of the notes
  const [customer] = customers.filter(c => {
    return c.notes.filter(n => n.id === notes_id && n.realtor === realtor).length > 0;
  });

  if (!customer) {
    return getResponse({
      error: 'You must be the author of this note in order to edit it',
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
      query: mutation_update_notes,
      variables: {
        id: notes_id,
        body: notes,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (response?.data?.updateNote?.data?.id) {
    const {
      id,
      attributes: { body },
    } = response.data.updateNote.data;
    return getResponse({
      id: Number(id),
      body,
    });
  }
}
