import { getResponse } from '../../response-helper';

export async function POST(req: Request) {
  const { property } = await req.json();
  return getResponse({ property });
}
