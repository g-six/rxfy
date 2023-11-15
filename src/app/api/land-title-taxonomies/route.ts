import { NextResponse } from 'next/server';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QUERY = `query GetLandTitleTaxonomies {
    landTitleTaxonomies {
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
    data: { landTitleTaxonomies },
  } = await data.json();
  const { records } = landTitleTaxonomies as unknown as {
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
