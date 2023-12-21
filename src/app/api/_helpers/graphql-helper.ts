export async function graphQL(query: string, variables: Record<string, unknown>) {
  try {
    const response = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    if (response.ok) {
      const json = await response.json();
      return json.data;
    } else {
      console.error('Error in graphQL');
      console.error('');
      console.error(query);
      console.error('');
      console.error('');
      console.error({ variables });
      return;
    }
  } catch (e) {
    console.error('Error in graphQL');
    console.error('');
    console.error(query);
    console.error('');
    console.error('');
    console.error({ variables });
  }
}
