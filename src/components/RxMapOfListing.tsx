'use client';
import React, { ReactElement } from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { createNeighborhoodMapOptions } from '@/_utilities/map-helper';

export enum MapType {
  STREET = 'street',
  NEIGHBORHOOD = 'neighborhood',
}

type Props = {
  property: PropertyDataModel | null;
  child: ReactElement;
  mapType?: MapType | string;
};

export default function RxMapOfListing({ property, child, mapType }: Props) {
  const ref = React.useRef(null);
  const [mapZoom] = React.useState(15); //zoom level
  const [mapCenter] = React.useState({ lng: property?.lon, lat: property?.lat });

  const google = window?.google ? window['google'] : undefined;

  const initNeighborhoodView = React.useCallback(() => {
    if (ref && ref.current && google) {
      const localContext = new google.maps.localContext.LocalContextMapView({
        element: ref.current,
        placeTypePreferences: [
          { type: 'department_store', weight: 1 },
          { type: 'drugstore', weight: 1 },
          { type: 'bakery', weight: 1 },
          { type: 'bank', weight: 1 },
          { type: 'cafe', weight: 2 },
          { type: 'restaurant', weight: 2 },
          { type: 'supermarket', weight: 2 },
          { type: 'primary_school', weight: 3 },
          { type: 'secondary_school', weight: 3 },
          { type: 'park', weight: 3 },
        ],
        maxPlaceCount: 24,
        placeChooserViewSetup: { layoutMode: google.maps.localContext.PlaceChooserLayoutMode.HIDDEN },
      });
      if (localContext?.map) {
        const mapOptions = Object.assign(
          {},
          {
            center: mapCenter,
            zoom: mapZoom,
          },
          createNeighborhoodMapOptions(),
        ) as google.maps.MapOptions;
        localContext.map.setOptions(mapOptions);
      }
      new google.maps.Marker({
        position: mapCenter as google.maps.LatLngLiteral,
        map: localContext.map,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAbUlEQVR4Ae3LoQ2AMAAF0TMYPJoV2IApGIJtmIMtmIAVqutraj6IiqZpmyYoCO/08R7bXbOOHSF2Ohr0HCh00EPdwImiTgYqRgxKMowUTFiUyTKRMeNQIcdMYsGjSp6FyIoaWkmoUuLxEPzDh1xIaLFFuTyHMgAAAABJRU5ErkJggg==',
        zIndex: 30,
      });
      localContext.search();
    }
  }, [mapCenter, mapZoom, google]);

  const initStreetView = React.useCallback(() => {
    if (ref && ref.current) {
      // in documentation you wil find:
      // const sv = new google.maps.StreetViewService(), which is the following here:
      const google = window['google'];
      const sv = new google.maps.StreetViewService();
      // data.ref is a element of DOM in which StreetView should be displayed
      const panorama = new google.maps.StreetViewPanorama(ref.current, {
        linksControl: false,
        panControl: false,
        enableCloseButton: false,
      });
      // Look for a nearby Street View panorama by given defCenter = { lat, lng }
      // getPanorama will return the nearest pano when the given
      // radius is 50 meters or less, center is the object defCenter = { lat, lng }
      const opts = { location: mapCenter as google.maps.LatLngLiteral, radius: 50, source: google.maps.StreetViewSource.OUTDOOR };
      sv.getPanorama(opts, data => {
        // please do not be confused with data object above
        panorama.setPano(data?.location?.pano as string);
        panorama.setPov({ heading: 320, pitch: 0 });
        panorama.setVisible(true);
        // now we calculate heading (ange of rotation) after map is inited (approx 500ms)
        // so we take current position of the viewer (center of panorama on street view map) and defCenter
        // having those two, one can calculate spherical angle of rotation by calling .spherical.computeHeading
        setTimeout(() => {
          const coords = mapCenter as google.maps.LatLngLiteral;
          const propertyLocation = new window.google.maps.LatLng(coords.lat, coords.lng);
          const panoCoors = panorama?.getLocation()?.latLng as google.maps.LatLng;
          const heading = window.google.maps.geometry.spherical.computeHeading(panoCoors, propertyLocation);
          panorama.setPov({ heading: heading, pitch: 0 });
        }, 500);
      });
    }
  }, [mapCenter, ref]);

  React.useEffect(() => {
    if (mapType === MapType.NEIGHBORHOOD) {
      initNeighborhoodView();
      setTimeout(() => {
        document.querySelectorAll('.gm-ui-hover-effect').forEach(el => (el as HTMLElement).click());
      }, 500);
    } else if (mapType === MapType.STREET) {
      initStreetView();
    }
  }, [mapType, mapCenter, ref, initNeighborhoodView, initStreetView]);

  const style = Object.assign({}, child.props.style, {
    height: child.props?.style?.height ? child.props.style.height : '300px',
  });

  return <div className={child.props.className} style={style} ref={ref} />;
}
