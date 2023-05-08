import { PUT as updateAccount } from '@/app/api/update-account/route';

export async function PUT(request: Request) {
  return await updateAccount(request);
}
