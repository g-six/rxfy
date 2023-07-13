import axios from 'axios';

export async function graphQL(query: string, variables: Record<string, unknown>) {
  try {
    const {
      data: { data },
    } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return data;
  } catch (e) {
    console.error('Error in graphQL');
    console.error('');
    console.error(query);
    console.error('');
    console.error('');
    console.error({ variables });
  }
}
