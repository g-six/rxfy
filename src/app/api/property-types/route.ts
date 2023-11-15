import { NextResponse } from 'next/server';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QUERY = `query GetPropertyTypes {
    propertyTypes {
      records: data {
        id
        attributes {
          name
        }
      }
    }
}`;
export async function GET() {
  const data = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    body: JSON.stringify({
      query: QUERY,
    }),
    method: 'POST',
    headers,
  });

  const {
    data: { propertyTypes },
  } = await data.json();
  const { records } = propertyTypes as unknown as {
    records: {
      id: string;
      attributes: {
        name: string;
      };
    }[];
  };

  return NextResponse.json(
    records.map(r => ({
      ...r.attributes,
      id: Number(r.id),
    })),
  );
}
