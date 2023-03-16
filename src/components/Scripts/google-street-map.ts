export function addPropertyMapScripts(
  property: Record<string, unknown>
): string {
  return `
            const markerIcon ="https://uploads-ssl.webflow.com/63963a54d6a20c8f0853af43/63a199474828c172d28a9b05_Map.svg";
            const property = {
                lat: ${property.lat},
                lng: ${property.lng},
                name: "${property.Address}",
                neighbourhood: "${property.Area}",
                province: "${property.Province_State}",
            };
        
            function initNeighborhoodMap() {
                const localContext = new google.maps.localContext.LocalContextMapView({
                    element: document.getElementById("PropertyMapWrapper"),
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
                    ${JSON.stringify(
                      createNeighborhoodMapOptions()
                    )},
                ));
                placeMarker(property, localContext.map);
                localContext.search();
            }
            function placeMarker(property, map) {
                if (!property || !map) return
                var marker = new google.maps.Marker({
                    position: { lat: property.lat, lng: property.lng },
                    map: map,
                    title: property.name,
                    icon: markerIcon,
                });
                console.log('property page', property.lat, property.lng);
                console.log('property page', property.Area, property.Address);
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
        `;
}
