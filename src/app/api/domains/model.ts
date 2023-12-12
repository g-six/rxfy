export const gq_get_domain = `query GetDomainBy($filters: DomainFiltersInput!) {
    domains(filters: $filters) {
        data {
            id
            attributes {
                context
                sitemap
                filters
            }
        }
    }
}`;
export async function getDomain(domain_name: string) {
  const gql = {
    query: gq_get_domain,
    variables: {
      filters: {
        name: {
          eqi: domain_name,
        },
      },
    },
  };

  const results = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify(gql),
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });

  const response_data = await results.json();

  if (response_data?.data?.domains.data) {
    let [record] = response_data?.data?.domains.data;

    if (record.id)
      return {
        ...record.attributes,
        id: Number(record.id),
      };
  }

  return {};
}
