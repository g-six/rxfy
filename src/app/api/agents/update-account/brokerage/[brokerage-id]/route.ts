import { PUT as update } from '../route';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  return await update(req);
}
