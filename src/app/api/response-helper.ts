export function getResponse(data: { [key: string]: any }, status = 200 | 400 | 401 | 405) {
  return new Response(JSON.stringify(data, null, 4), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}
