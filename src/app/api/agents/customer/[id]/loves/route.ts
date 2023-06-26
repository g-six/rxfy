import { getResponse } from '@/app/api/response-helper';
import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { GET as checkSession } from '@/app/api/check-session/route';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, LovedPropertyDataModel, PropertyDataModel } from '@/_typings/property';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getCustomerLoves } from './model';

export async function GET(request: NextRequest) {
  const agents_customer_id = Number(request.url.split('/loves')[0].split('/').pop());
  if (isNaN(agents_customer_id)) {
    return getResponse({
      error: 'Please provide a valid id for the agent customer record',
    });
  }
  const agent = await checkSession(request, true);

  const {
    id: realtor,
    customers,
    session_key,
  } = agent as unknown as {
    id: number;
    customers: { notes: string[]; id: number }[];
    session_key: string;
  };
  if (!session_key) {
    return getResponse({
      error: "Please login to retrieve your customer's loved homes",
    });
  }
  const [customer] = customers.filter(c => c.id === agents_customer_id);

  if (!customer) {
    return getResponse({
      error: 'Please provide a valid customer relationship id',
    });
  }

  const properties: LovedPropertyDataModel[] = await getCustomerLoves(agents_customer_id);
  /////
  return getResponse({
    properties,
    session_key,
  });
}
