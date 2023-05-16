import axios, { AxiosError } from 'axios';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { getResponse } from '../response-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
import {
  getGqlForInsertProperty,
  getGqlForUpdateProperty,
  getMutationForNewAgentInventory,
  getMutationForPhotoAlbumCreation,
  retrieveFromLegacyPipeline,
  slugifyAddress,
  slugifyAddressRecord,
} from '@/_utilities/data-helpers/property-page';
import { repairIfNeeded } from '../mls-repair';
import { getRealEstateBoard } from '@/app/api/real-estate-boards/model';
import { createAgentsFromProperty } from './model';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;

const mutation_create_property = `mutation CreateProperty($data: PropertyInput!) {
  createProperty(data: $data) {
    data {
      id
      attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
    }
  }
}`;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mls_id = url.searchParams.get('mls_id') as string;
    let results = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_find_home,
        variables: {
          mls_id,
        },
      },
      {
        headers,
      },
    );
    let property;
    if (results?.data?.data?.properties?.data?.length === 0 || url.searchParams.get('regen')) {
      const legacy_result = await retrieveFromLegacyPipeline({
        query: { bool: { filter: [{ match: { 'data.MLS_ID': mls_id } }], should: [] } },
        size: 1,
        from: 0,
      });

      if (legacy_result && legacy_result.length) {
        const hit = legacy_result[0];
        if (hit) {
          const real_estate_board_res = await getRealEstateBoard(hit as unknown as { [key: string]: string });
          const real_estate_board = real_estate_board_res?.id || undefined;
          // Create agents and temporarily store their record ids for linking properties
          const agents = await createAgentsFromProperty(hit as MLSProperty, real_estate_board_res);
          const gql_config =
            results?.data?.data?.properties?.data?.length === 0
              ? getGqlForInsertProperty(hit, real_estate_board)
              : getGqlForUpdateProperty(results?.data?.data?.properties?.data[0].id, hit, real_estate_board);

          const {
            data: {
              data: {
                property: { data },
              },
              errors,
            },
          } = await axios.post(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, gql_config, {
            headers,
          });

          if (errors) {
            console.log('Property create error');
            console.log(JSON.stringify(errors, null, 4));
            return getResponse(errors, 400);
          }

          property = {
            ...data.attributes,
            id: Number(data.id),
          };

          console.log({ property });

          if (!property.property_photo_album?.data?.photos?.length && hit.photos && Array.isArray(hit.photos)) {
            const album_results = await axios.post(process.env.NEXT_APP_CMS_GRAPHQL_URL as string, getMutationForPhotoAlbumCreation(property.id, hit.photos), {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                'Content-Type': 'application/json',
              },
            });
            const {
              data: {
                data: { createPropertyPhotoAlbum },
              },
            } = album_results;
            property = {
              ...property,
              property_photo_album: {
                data: {
                  id: Number(createPropertyPhotoAlbum.data.id),
                  attributes: createPropertyPhotoAlbum.data.attributes,
                },
              },
            };
          }

          agents.forEach(agent =>
            axios.post(process.env.NEXT_APP_CMS_GRAPHQL_URL as string, getMutationForNewAgentInventory(property.id, agent), {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
                'Content-Type': 'application/json',
              },
            }),
          );
        }
      }
    } else if (results?.data?.data?.properties?.data?.length) {
      const { id, attributes } = results?.data?.data?.properties?.data[0];
      property = {
        ...attributes,
        id: Number(id),
      };
    }
    console.log('property next');
    console.log('property next');
    console.log(property);
    console.log('property next');
    console.log('property next');
    if (property) {
      const { mls_data, ...record } = property;
      let output: {
        [key: string]: string | number | boolean | string[] | Date;
      } = {
        ...property,
        id: Number(record.id),
      };

      let legacy_data: {
        [key: string]: string | number | boolean | string[] | Date;
      } = {};

      const repaired = await repairIfNeeded(Number(record.id), output as unknown as { [key: string]: unknown } & PropertyDataModel, mls_data);

      Object.keys(property).forEach(key => {
        if (record[key]) {
          output = {
            ...output,
            ...repaired,
            [key]: record[key],
          };
        }
      });
      mls_data &&
        mls_data !== null &&
        Object.keys(mls_data).forEach(key => {
          if (mls_data[key]) {
            switch (key) {
              case 'photos':
                if (mls_data[key].length > 0) {
                  const photos = mls_data[key] as string[];
                  output = {
                    ...output,
                    thumbnail: `${process.env.NEXT_APP_IM_ENG}/w_720/${photos[0]}`,
                    photos: photos.slice(1).map(photo_url => {
                      return getImageSized(photo_url, 999);
                    }),
                  };
                }
                break;
              case 'Address':
              case 'Status':
              case 'Remarks':
                output = {
                  ...output,
                  [key.toLowerCase()]: capitalizeFirstLetter(mls_data[key].toLowerCase()),
                };
                break;
              case 'L_PublicRemakrs':
                output = {
                  ...output,
                  description: capitalizeFirstLetter(mls_data[key].toLowerCase()),
                };
                break;
              case 'L_TotalBaths':
                output = {
                  ...output,
                  baths: Number(mls_data[key]),
                };
                break;
              case 'B_Style':
                output = {
                  ...output,
                  style: mls_data[key],
                  [key]: mls_data[key],
                };
                break;
              case 'LandTitle':
                output = {
                  ...output,
                  land_title: mls_data[key],
                  [key]: mls_data[key],
                };
                break;
              case 'LFD_ServicesConnected_7':
                output = {
                  ...output,
                  connected_services: mls_data[key],
                  [key]: mls_data[key],
                };
                break;
              default:
                legacy_data = {
                  ...legacy_data,
                  [key]: mls_data[key] !== null ? mls_data[key] : undefined,
                };
                break;
            }
          }
        });

      if (output && output.id) {
        const config: S3ClientConfig = {
          region: 'us-west-2',
          credentials: {
            accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
            secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
          },
        };
        const client = new S3Client(config);

        const { property_photo_album, real_estate_board, ...data } = output;
        const { neighbours, sold_history } = await getNeighboursAndHistory(
          mls_data.PropertyType,
          mls_data.AddressNumber,
          mls_data.AddressStreet,
          data.title as string,
          data.postal_zip_code as string,
          legacy_data.Province_State as string,
        );

        const {
          data: {
            id: real_estate_board_id,
            attributes: { name: real_estate_board_name, legal_disclaimer },
          },
        } = real_estate_board as unknown as {
          data: {
            id: number;
            attributes: {
              [key: string]: string;
            };
          };
        };

        const filepath = `listings/${output.mls_id}/${slugifyAddressRecord(data.title as string, output.id as number)}.json`;
        const mls_filepath = `listings/${output.mls_id}/recent.json`;
        const mls_filepath_ts = `listings/${output.mls_id}/${new Date().getFullYear()}-${new Date().getMonth() + 1}/${Date.now()}.json`;
        const legacy_filepath = `listings/${output.mls_id}/legacy.json`;
        const Bucket = process.env.NEXT_APP_S3_PAGES_BUCKET as string;
        let Body = JSON.stringify(
          {
            ...data,
            real_estate_board: {
              id: real_estate_board_id,
              name: real_estate_board_name,
              legal_disclaimer,
            },
            neighbours: [],
            sold_history: [],
            slug: slugifyAddress(data.title as string),
          },
          null,
          4,
        );
        let command = new PutObjectCommand({
          Bucket,
          Key: filepath,
          ContentType: 'text/json',
          Body,
        });
        client.send(command).then(console.log);

        command = new PutObjectCommand({
          Bucket,
          Key: mls_filepath,
          ContentType: 'text/json',
          Body,
        });
        client.send(command).then(console.log);

        command = new PutObjectCommand({
          Bucket,
          Key: mls_filepath_ts,
          ContentType: 'text/json',
          Body,
        });
        client.send(command).then(console.log);

        Body = JSON.stringify(
          {
            ...legacy_data,
            real_estate_board: {
              id: real_estate_board_id,
              name: real_estate_board_name,
              legal_disclaimer,
            },
            slug: slugifyAddress(data.title as string),
          },
          null,
          4,
        );
        command = new PutObjectCommand({
          Bucket,
          Key: legacy_filepath,
          ContentType: 'text/json',
          Body,
        });
        client.send(command).then(console.log);

        invalidateCache([`/${filepath}`, `/${mls_filepath}`, `/${mls_filepath_ts}`, `/${legacy_filepath}`]);
        // if (real_estate_board?.attributes.name && xhr?.data?.data?.property) {
        // }
      }

      return getResponse(
        {
          id: record.id,
          property: {
            ...output,
            mls_data: legacy_data,
          },
        },
        200,
      );
    }
    return getResponse(results?.data || {}, 200);
  } catch (e) {
    const axerr = e as AxiosError;
    console.log('axerr error');
    console.log(axerr);
    console.log('end axerr error');
    return getResponse(
      {
        message: axerr.message,
        code: axerr.code,
      },
      400,
    );
  }
}

export function invalidateCache(Items: string[]) {
  const NEXT_APP_SITES_DIST_ID = process.env.NEXT_APP_SITES_DIST_ID as string;
  const client = new CloudFrontClient({
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.NEXT_APP_UPLOADER_KEY_ID as string,
      secretAccessKey: process.env.NEXT_APP_UPLOAD_SECRET_KEY as string,
    },
  });
  const command = new CreateInvalidationCommand({
    DistributionId: NEXT_APP_SITES_DIST_ID,
    InvalidationBatch: {
      CallerReference: new Date().getTime().toString(),
      Paths: {
        Quantity: Items.length,
        Items,
      },
    },
  });
  console.log('Invalidating cache for ', NEXT_APP_SITES_DIST_ID);
  return client.send(command);
}

async function getNeighboursAndHistory(
  property_type: string,
  address_number: string,
  address_street: string,
  address: string,
  postal_zip_code: string,
  province_state: string,
) {
  console.log('getNeighboursAndHistory for units in the building', `${address_number} ${address_street}`);
  const {
    data: {
      hits: { hits },
    },
  } = await axios.post(
    process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    {
      query: {
        bool: {
          filter: [{ match: { 'data.PropertyType': property_type } }],
          should: [
            { match: { 'data.AddressNumber': address_number } },
            { match: { 'data.AddressStreet': address_street } },
            {
              match: {
                'data.PostalCode_Zip': postal_zip_code,
              },
            },
            {
              match: {
                'data.Province_State': province_state,
              },
            },
          ],
          minimum_should_match: 3,
        },
      },
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const neighbours: MLSProperty[] = [];
  const sold_history: MLSProperty[] = [];
  hits.forEach(({ _source }: { _source: unknown }) => {
    const { data: hit } = _source as {
      data: Record<string, unknown>;
    };
    let property = {
      Address: '',
      Status: '',
    };
    Object.keys(hit as Record<string, unknown>).forEach(key => {
      if (hit[key] && key !== 'id') {
        property = {
          ...property,
          [key]: hit[key],
        };
      }
    });
    if (property.Status === 'Sold' && property.Address === address) sold_history.push(property as MLSProperty);
    else if (property.Status === 'Active') neighbours.push(property as MLSProperty);
  });

  return {
    sold_history,
    neighbours,
  };
}
