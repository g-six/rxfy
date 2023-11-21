import QR from 'qrcode';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { LISTING_FEETERS_FIELDS, LISTING_MEASUREMENT_FIELDS, LISTING_MONEY_FIELDS, LISTING_NUMERIC_FIELDS } from '@/_utilities/data-helpers/listings-helper';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { AgentData } from '@/_typings/agent';
import { RoomDetails } from '@/_typings/property';
import { construction_stats, dimension_stats, general_stats } from '@/_utilities/data-helpers/property-page';

export async function getPdf(page_url: string, data: unknown) {
  const { data: html_data } = await axios.get(page_url);
  const $: CheerioAPI = load(html_data);
  $('script').remove();
  let values = data as { [key: string]: string };

  Object.keys(values).forEach(key => {
    if (LISTING_MONEY_FIELDS.includes(key))
      values = {
        ...values,
        [key]: `$${new Intl.NumberFormat(undefined).format(Number(values[key]))}`,
      };
    else if (key === 'description' && values[key].length > 720) {
      const sentences = values[key].split('. ');
      values = {
        ...values,
        [key]: sentences[0],
      };
      sentences.slice(1).forEach(sentence => {
        if (values[key].length + sentence.length < 720) {
          values = {
            ...values,
            [key]: `${values[key] + '. ' + sentence}`,
          };
        }
      });
      values = {
        ...values,
        [key]: values[key],
      };
    } else if (key === 'build_features') {
      const features = values[key] as unknown as {
        name: string;
      }[];
      features.forEach(item => {
        if (item.name.toLowerCase().split(' ').includes('frame')) {
          const frame = item.name.split(' - ').pop() || '';
          values = {
            ...values,
            frame,
          };
        }
      });
    } else if (key === 'dwelling_type') {
      const { name } = values[key] as unknown as {
        name: string;
      };
      values = {
        ...values,
        [key]: name,
      };
    } else if (key === 'lot_area' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(v)} ${values.lot_uom}`,
        };
      }
    } else if (key === 'lot_sqft' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(values[key] as unknown as number)} sqft`,
        };
      }
    } else if (key === 'lot_sqm' && values[key] && !values['lot_sq']) {
      const v = Number(values[key]);
      if (!isNaN(v) && v) {
        values = {
          ...values,
          lot_sq: `${new Intl.NumberFormat().format(values[key] as unknown as number)} sqm`,
        };
      }
    } else if (LISTING_NUMERIC_FIELDS.includes(key)) {
      values[key] = new Intl.NumberFormat().format(Number(values[key]));
      if (LISTING_MEASUREMENT_FIELDS.includes(key)) {
        if (key === 'floor_area' && values.floor_area_uom === 'Feet') {
          values[key] = values[key] + ' Sqft';
        } else {
          values[key] = values[key] + ' Sqm';
        }
      }
    } else if (LISTING_FEETERS_FIELDS.includes(key)) {
      values[key] = new Intl.NumberFormat().format(Number(values[key])) + 'sqft';
    } else if (key === 'agent') {
      const agent = values[key] as unknown as { [key: string]: unknown };
      Object.keys(agent).forEach(agent_field => {
        if (agent_field === 'metatags') {
          const metatags = agent[agent_field] as { [key: string]: unknown };
          Object.keys(metatags).forEach(mtag => {
            if (typeof metatags[mtag] === 'string') {
              values = {
                ...values,
                [`agent.metatags.${mtag}`]: metatags[mtag] as string,
              };
            }
          });
        } else if (typeof agent[agent_field] === 'string') {
          values = {
            ...values,
            [`${key}.${agent_field}`]: agent[agent_field] as string,
          };
        }
      });
    } else if (typeof values[key] === 'object') {
      const { legal_disclaimer } = values[key] as unknown as {
        [key: string]: string;
      };

      if (key === 'real_estate_board' && legal_disclaimer) {
        values = {
          ...values,
          'real_estate_board.legal_disclaimer': legal_disclaimer,
        };
      }
    }
  });

  values = {
    ...values,
    map:
      values.lon && values.lat
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/url-https%3A%2F%2Fpages.leagent.com%2Ficons%2Fmap-pin.png%3Fv%3D1(${values.lon},${values.lat})/${values.lon},${values.lat},13,0,60/580x200?access_token=${process.env.NEXT_APP_MAPBOX_TOKEN}`
        : '',
  };
  const map_div = `<div style="background-color: transparent !important; background-image: url('${
    values.map
  }'); background-position: center; background-size: cover;" class="${$('[data-field="map"]').attr('class')}"></div>`;
  $('[data-field="map"]').replaceWith(map_div);

  const { photos } = values as unknown as { photos: string[] };
  const image_container = $('[data-image="photos"]');
  photos &&
    photos.length > 1 &&
    photos.slice(1).forEach((url, idx) => {
      if (idx === 0) {
        $(`[data-image="photos"]:nth-child(${idx + 1})`).replaceWith(
          `<div data-image="photos" style="background-image: url(${getImageSized(
            url,
            320,
          )}); background-position: center; background-size: cover;" class="${image_container.attr('class')} filled"></div>`,
        );
      } else if (idx < 9) {
        $(`[data-image="photos"]:last-child`)
          .parent()
          .append(
            `<div data-image="photos" style="background-image: url(${getImageSized(
              url,
              320,
            )}); background-position: center; background-size: cover;" class="${image_container.attr('class')} filled"></div>`,
          );
      }

      // replaceWith(`<div style="background-image: url(${getImageSized(url, 320)}); background-position: center; background-size: cover;" class="${$(
      //   `.b-images:nth-child(${idx + 1})`,
      // ).attr('class')} filled"></div>`)
      // image_container.clone()
      // $(`.b-images:nth-child(${idx + 1})`).replaceWith(
      //   `<div style="background-image: url(${getImageSized(url, 320)}); background-position: center; background-size: cover;" class="${$(
      //     `.b-images:nth-child(${idx + 1})`,
      //   ).attr('class')} filled"></div>`,
      // );
    });

  $('[data-field="cover_photo"]').replaceWith(
    `<div style="background-image: url(${getImageSized(values.photos[0], 600)}); background-position: center; background-size: cover;" class="${$(
      '[data-field="cover_photo"]',
    ).attr('class')}"></div>`,
  );

  const headshot_replacement = values['agent.metatags.headshot'] ? getImageSized(values['agent.metatags.headshot'], 200) : getImageSized(values.photos[0], 200);

  $('[data-image="agent.metatags.headshot"]').replaceWith(
    `<div style="background-image: url(${headshot_replacement}); background-position: center; background-size: cover;" class="${$(
      '[data-image="agent.metatags.headshot"]',
    ).attr('class')}"></div>`,
  );

  const { agent } = values as unknown as {
    agent: AgentData;
  };

  let logo_replacement = values['agent.metatags.logo_for_light_bg'] ? getImageSized(values['agent.metatags.logo_for_light_bg'], 200) : '';
  if (!logo_replacement) logo_replacement = values['agent.metatags.logo_for_dark_bg'] ? getImageSized(values['agent.metatags.logo_for_dark_bg'], 200) : '';
  if (logo_replacement)
    $('[data-image="agent.metatags.logo_for_light_bg"]').replaceWith(
      `<img class="${$('[data-image="agent.metatags.logo_for_light_bg"]').attr('class')}" src="${logo_replacement}"></div>`,
    );
  let qr_url = '';
  if (agent.domain_name) {
    qr_url = `https://${agent.domain_name}/id`;
  } else if (agent.agent_id && agent.metatags.profile_slug) {
    qr_url = `https://leagent.com/${agent.agent_id}/${agent.metatags.profile_slug}/id`;
  }

  if (qr_url) {
    const qr = await QR.toDataURL(qr_url, {
      color: {
        light: '#0000', // Transparent background
      },
    });
    $('[data-image="qr"]').replaceWith(`<img src="${qr}" width="100" height="100" />`);
  }

  const { rooms } = (values.room_details as unknown as {
    rooms: RoomDetails[];
  }) || { rooms: [] };
  const { amenities, connected_services, facilities, places_of_interest, parking } = values as unknown as {
    [key: string]: {
      name: string;
    }[];
  };

  const sections: {
    key: string;
    labels: any;
    alias?: string;
  }[] = [
    {
      key: 'property_info',
      labels: general_stats,
    },
    {
      key: 'construction_info',
      labels: construction_stats,
      alias: 'construction',
    },
    {
      key: 'dimensions_info',
      labels: dimension_stats,
      alias: 'dimensions',
    },
  ];
  console.log('');
  sections.forEach(group => {
    const Wrapper = $(`[data-group="${group.key}"]`).parent();
    Object.keys(group.labels).forEach(stat => {
      const Row = $(`[data-group="${group.key}"]`).first().clone();
      if (values[stat] && group.labels[stat]) {
        if (typeof values[stat] !== 'object') {
          Row.find(`[data-field="${group.alias || group.key}_result"]`).text(values[stat]);
          Row.find(`[data-field="${group.alias || group.key}_name"]`).text(group.labels[stat]);
          Wrapper.append(Row);
          console.log(stat, typeof values[stat], values[stat], group.key);
        }
      }
    });
    $(`[data-group="${group.key}"]`).first().remove();
  });
  console.log('');
  console.log('');

  let amenities_facilities: { name: string }[] = [];
  if (amenities?.length) amenities_facilities = amenities_facilities.concat(amenities);
  if (facilities?.length) amenities_facilities = amenities_facilities.concat(facilities);
  if (places_of_interest?.length) amenities_facilities = amenities_facilities.concat(places_of_interest);
  if (amenities_facilities?.length) {
    const classname = $('[data-field="amenities_name"]').attr('class');
    const wrapper = $('[data-field="amenities_name"]:last-child').parent();
    amenities_facilities.forEach(({ name }) => {
      // placeholder.replaceWith(`<span class="${placeholder.attr('class')} text-xs">${name}</span>`);
      $(wrapper).append(`<div class="${classname}">${name}</div>`);
    });
  }
  // $('[data-group="amenities"] .field-value:first').remove();
  // if (facilities?.length) {
  //   facilities.forEach(({ name }) => {
  //     placeholder.replaceWith(`<span class="${placeholder.attr('class')} text-xs">${name}</span>`);
  //     $('[data-group="amenities"]').append(placeholder);
  //   });
  // }
  // if (parking?.length) {
  //   parking.forEach(({ name }) => {
  //     if (name !== 'Other') placeholder.replaceWith(`<span class="${placeholder.attr('class')} text-xs">${name}</span>`);
  //     $('[data-group="amenities"]').append(placeholder);
  //   });
  // }
  // $('[data-group="amenities"] .field-value:first').remove();

  let placeholder = $('[data-group="services"] .field-value:first').clone();
  $('[data-group="services"] .field-value:first').remove();
  if (connected_services?.length) {
    connected_services.forEach(({ name }) => {
      placeholder.replaceWith(`<span class="${placeholder.attr('class')} text-xs">${name}</span>`);
      $('[data-group="services"]').append(placeholder);
    });
  }
  $('[data-group="services"] .field-value:first').remove();

  if (rooms && rooms.length) {
    let cnt = 6;
    rooms.forEach((room: RoomDetails) => {
      if (cnt > 0 && room.type.toLowerCase().indexOf('bed') >= 0) {
        cnt--;
        placeholder = $('[data-repeater="room"]:first').clone();
        $(placeholder)
          .find('[data-row-col="level"]')
          .replaceWith(`<span class="${$('[data-repeater="room"]:first [data-row-col="level"]').attr('class')} text-xs">${room.level}</span>`);
        $(placeholder)
          .find('[data-row-col="type"]')
          .replaceWith(`<span class="${$('[data-repeater="room"]:first [data-row-col="type"]').attr('class')} text-xs">${room.type}</span>`);
        $(placeholder)
          .find('[data-row-col="dimensions"]')
          .replaceWith(
            `<span class="${$('[data-repeater="room"]:first [data-row-col="dimensions"]').attr('class')} text-xs">${room.width} x ${room.length}</span>`,
          );
        $('.rooms-info-rows').append(placeholder);
      } else {
      }
    });
    $('[data-repeater="room"]:first').remove();
  }

  const {
    agent: { metatags },
  } = values as unknown as {
    agent: {
      metatags: {
        [k: string]: string;
      };
    };
  };

  const { geocoding } = metatags as unknown as {
    geocoding: {
      city: string;
      state_province: string;
      postal_zip_code: string;
    };
  };
  $('[data-field]').each((idx, el) => {
    let field = el.attribs['data-field'];
    if (field === 'formatted_address') field = 'title';

    if (el.attribs['data-object'] === 'agent') {
      const { agent } = values as unknown as {
        agent: {
          [k: string]: string;
        };
      };
      if (field === 'address') {
        let address = metatags.target_city;
        if (geocoding?.city) {
          address = geocoding.city;
          if (geocoding?.postal_zip_code) address = `${address}, `;
        }
        if (geocoding?.postal_zip_code) address = `${address}${geocoding.postal_zip_code}`;
        if (geocoding?.state_province) address = `${address} ${geocoding.state_province}`;
        if (address) $(el).text(address);
      } else if (['logo_for_light_bg', 'logo_for_dark_bg'].includes(field) && metatags[field]) {
        $(el).replaceWith(
          `<div style="background-color: transparent !important; background-image: url('${
            metatags[field]
          }'); background-position: center; background-repeat: no-repeat; background-size: ${
            field === 'headshot' ? 'cover' : 'contain'
          }; height: 100%; min-width: 120px;">&nbsp;</div>`,
        );
      } else {
        $(el).text(agent[field]);
      }
    } else {
      if (field === '') {
      } else {
        if (field && values[field]) {
          if (field !== 'map') {
            $(el).text(values[field]);
          }
        } else {
          console.log(field, 'field not available');
          // $(el).remove();
        }
      }
    }
  });

  $('[data-stats]').each((idx, el) => {
    const field = el.attribs['data-stats'];
    if (field) {
      let v = values[field];
      if (field === 'frontage' && !v) {
        if (values.frontage_feet) v = new Intl.NumberFormat().format(Number(values.frontage_feet)) + 'sqft';
        if (values.frontage_metres) v = new Intl.NumberFormat().format(Number(values.frontage_metres)) + 'sqm';
      }
      if (v) {
        $(el).find('.field-value').html(v);
      } else $(el).remove();
    }
  });

  const pdf_req = await fetch(`https://cloudcapture.cc/api/pdf`, {
    body: JSON.stringify({
      html: $.html(),
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `API_KEY ${process.env.NEXT_APP_CLOUDCAPTURE_API_KEY}`,
    },
  });
  return pdf_req;
}
