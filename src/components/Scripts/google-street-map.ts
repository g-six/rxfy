import { PropertyDataModel } from '@/_typings/property';
import { createNeighborhoodMapOptions } from '@/_utilities/map-helper';
import { randomString } from '@/_utilities/data-helpers/auth-helper';

export enum MapType {
  STREET = 'street',
  NEIGHBORHOOD = 'neighborhood',
}

export type MapOptions = {
  elementQuerySelector?: string;
  type?: MapType | string;
};

export function addPropertyMapScripts(property: PropertyDataModel, options?: MapOptions): string {
  const key = randomString();
  options = options ? options : { elementQuerySelector: '.street-view-div', type: MapType.STREET };
  options.elementQuerySelector = options.elementQuerySelector ? options.elementQuerySelector : '.street-view-div';
  options.type = options.type ? options.type : MapType.STREET;
  return `
      const markerIcon ="https://uploads-ssl.webflow.com/63963a54d6a20c8f0853af43/63a199474828c172d28a9b05_Map.svg";
      const property = {
          lat: ${property.lat},
          lng: ${property.lon},
          name: "${property.title}",
          neighbourhood: "${property.subarea_community || property.area}",
          province: "${property.state_province}",
      };
  
      function initNeighborhood${key}Map(element) {
          const localContext = new google.maps.localContext.LocalContextMapView({
              element: element || document.querySelector(".map-div"),
              placeTypePreferences: [
                  {type: 'department_store', weight: 1},
                  {type: 'drugstore', weight: 1},
                  {type: 'bakery', weight: 1},
                  {type: 'bank', weight: 1},
                  {type: 'cafe', weight: 2},
                  {type: 'restaurant', weight: 2},
                  {type: 'supermarket', weight: 2},
                  {type: 'primary_school', weight: 3},
                  {type: 'secondary_school', weight: 3},
                  {type: 'park', weight: 3},
              ],
              maxPlaceCount: 24,
              placeChooserViewSetup: { layoutMode: google.maps.localContext.PlaceChooserLayoutMode.HIDDEN },
          });
          localContext.map.setOptions(Object.assign({}, 
              { center: { lat: property.lat, lng: property.lng }, zoom: 15 },
              ${JSON.stringify(createNeighborhoodMapOptions())},
          ));
          place${key}Marker(property, localContext.map);
          localContext.search();
      }

      function initStreet${key}View(selector) {
          const posCenter = {
              lat: ${property.lat},
              lng: ${property.lon},
          };

          const sv = new google.maps.StreetViewService();
          const panorama = new google.maps.StreetViewPanorama(document.querySelector(selector), {
              position: posCenter,
              addressControlOptions: { position: google.maps.ControlPosition.BOTTOM_CENTER },
              linksControl: false,
              panControl: false,
              enableCloseButton: false,
              streetViewControl: false,
          });
      
          sv.getPanorama({ location: posCenter, radius: 50, source: 'outdoor' }, data => {
              panorama.setPano(data.location.pano)
              panorama.setPov({ heading: 320, pitch: 0 });
              // now we calculate heading (ange of rotation) after map is inited (approx 500ms)
              // so we take current position of the viewer (center of panorama on street view map) and defCenter
              // having those two, one can calculate spherical angle of rotation by calling .spherical.computeHeading
              setTimeout(() => {
                  const propertyLocation = new window.google.maps.LatLng(posCenter.lat, posCenter.lng);
                  const heading = window.google.maps.geometry.spherical.computeHeading(panorama.getLocation().latLng, propertyLocation);
                  panorama.setPov({ heading: heading, pitch: 0 });
                  panorama.setVisible(true);
              }, 500);
          });
      }

      function place${key}Marker(property, map) {
          if (!property || !map) return
          var marker = new google.maps.Marker({
              position: { lat: property.lat, lng: property.lng },
              map: map,
              title: property.name,
              icon: markerIcon,
          });

          var infowindow = new google.maps.InfoWindow({ content:
              "<p><b>" +
              property.name +
              "</b></p><br><p>" +
              property.neighbourhood +
              '</p><div style="border-top: 1px solid rgb(204, 204, 204); margin-top: 9px; padding: 6px; font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-family: Roboto, Arial;"><a href="https://www.google.com/maps/search/?api=1&query=' +
              property.province +
              '" "target="_blank" rel="noopener" style="cursor: pointer; color: rgba(66, 127, 237); text-decoration: none;">View on Google Maps</a></div>',
          });
          google.maps.event.addListener(marker, "click", function () {
              infowindow.open(map, marker);
          });
      }
      
      if (${options.type} === ${MapType.NEIGHBORHOOD} && document.querySelector(${options.elementQuerySelector})) {
          console.log('Found ${options.elementQuerySelector}, try to replace using')
          initNeighborhood${key}Map(${options.elementQuerySelector});
      }
      if (${options.type} === ${MapType.STREET} && document.querySelector(${options.elementQuerySelector})) {
          console.log('Found ${options.elementQuerySelector}, try to replace using')
          initStreet${key}View(${options.elementQuerySelector});
      }
  `;
}
