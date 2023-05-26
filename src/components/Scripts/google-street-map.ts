import { PropertyDataModel } from '@/_typings/property';

export function addPropertyMapScripts(property: PropertyDataModel): string {
  return `
      const markerIcon ="https://uploads-ssl.webflow.com/63963a54d6a20c8f0853af43/63a199474828c172d28a9b05_Map.svg";
      const property = {
          lat: ${property.lat},
          lng: ${property.lon},
          name: "${property.title}",
          neighbourhood: "${property.subarea_community || property.area}",
          province: "${property.state_province}"
      };

      if (document.querySelector(".street-view-div")) {
          console.log('Found .street-view-div, try to replace using')
          initStreetView(".street-view-div");
      }

      function initStreetView(selector) {
          const posCenter = {
              lat: ${property.lat},
              lng: ${property.lon}
          };

          const sv = new google.maps.StreetViewService();
          const panorama = new google.maps.StreetViewPanorama(document.querySelector(selector), {
              position: posCenter,
              addressControlOptions: { position: google.maps.ControlPosition.BOTTOM_CENTER },
              linksControl: false,
              panControl: false,
              enableCloseButton: false,
              streetViewControl: false
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
  `;
}
