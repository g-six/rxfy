import { GET as checkSessionRoute } from '../route';
export async function GET(request: Request) {
  return await checkSessionRoute(request);
}
