export function getResponse(data: { [key: string]: any }, status: number = 200, content_type = 'application/json') {
  return new Response(content_type === 'application/json' ? JSON.stringify(data, null, 4) : data.body, {
    headers: {
      'Content-Type': content_type,
    },
    status,
  });
}
