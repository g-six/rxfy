import { NextResponse } from 'next/server';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QUERY = `query GetBuildingStyles {
    buildingStyles(pagination: { limit: 100 }) {
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
    data: { buildingStyles },
  } = await data.json();
  const { records } = buildingStyles as unknown as {
    records: {
      id: string;
      attributes: {
        name: string;
      };
    }[];
  };

  return NextResponse.json(
    records
      .map(r => ({
        ...r.attributes,
        id: Number(r.id),
      }))
      .sort((a, b) => {
        if (a.name < b.name) return -1;
        else if (a.name > b.name) return 1;
        return 1;
      }),
  );
}
