export function getResponse(data: { [key: string]: any }, status: number = 200) {
  return new Response(JSON.stringify(data, null, 4), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}
