import axios from 'axios';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getResponse } from '../response-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { retrieveFromLegacyPipeline } from '@/_utilities/data-helpers/property-page';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

export async function GET(request: Request) {
  const listings: (PropertyDataModel & { photos: string[] })[] = [];
  const url = new URL(request.url);
  const property_type = url.searchParams.get('property_type') as string;
  const postal_zip_code = url.searchParams.get('postal_zip_code') as string;
  const mls_id = url.searchParams.get('mls') as string;
  const beds = url.searchParams.get('beds') as string;

  const legacy_result = await retrieveFromLegacyPipeline({
    query: {
      bool: {
        filter: [
          { match: { 'data.PropertyType': property_type } },
          { match: { 'data.L_BedroomTotal': beds } },
          { match: { 'data.PostalCode_Zip': postal_zip_code } },
          { match: { 'data.Status': 'active' } },
        ],
        should: [],
        must_not: [{ match: { 'data.MLS_ID': mls_id } }],
      },
    },
    size: 3,
    from: 0,
  });
  if (legacy_result && legacy_result.length) {
    legacy_result.map((hit: MLSProperty) => {
      if (hit) {
        listings.push({
          ...getCombinedData({
            attributes: {
              title: hit.Address,
              asking_price: hit.AskingPrice,
              city: hit.City,
              area: hit.Area,
              mls_id: hit.MLS_ID,
              property_type: hit.PropertyType,
              mls_data: hit,
            },
          }),
          photos: hit.photos && Array.isArray(hit.photos) ? hit.photos.map(p => getImageSized(p, 480)) : [],
        });
      }
    });
  }
  return getResponse({ listings }, 200);
}
