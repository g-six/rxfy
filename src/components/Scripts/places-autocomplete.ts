/**
 * Google Places Auto Complete script to initialize input#search-input
 * @param props
 * @returns
 */
export default function initializePlacesAutocomplete(
  props: Record<string, string>
) {
  return `
    function objectToUrlParams(obj) {
        return Object.keys(obj).map(key => key + '=' + obj[key]).join('&');
    }
    // end of objectToUrlParams
 
    function initializePlacesAutocomplete() {
        var gpaInput = document.getElementById('search-input');

        if (!gpaInput) gpaInput = document.querySelector('.section---search input, .map-search-block input')

        if (gpaInput) {
            console.log('Page search is ready')
            var autocomplete = new google.maps.places.Autocomplete(gpaInput);
    
            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                const { address_components, geometry, vicinity } = autocomplete.getPlace()
                if (geometry) {
                    const params = {
                        lat: geometry.location.lat(),
                        lng: geometry.location.lng(),
                        swlat: geometry.viewport.getSouthWest().lat(),
                        swlng: geometry.viewport.getSouthWest().lng(),
                        nelat: geometry.viewport.getNorthEast().lat(),
                        nelng: geometry.viewport.getNorthEast().lng(),
                        type: 'R',
                        sorting: 'date_desc',
                        minprice: 0,
                        maxprice: 100000000,
                        baths: 0,
                        beds: 0,
                        minsqft: 0,
                        maxsqft: 63591,
                        zoom: 12,
                    }
                    if (address_components && address_components.length) {
                        address_components.forEach(({ types, long_name }) => {
                            if (long_name) {
                                if (
                                    types.includes('locality') &&
                                    types.includes('political')
                                ) {
                                    params.city = encodeURIComponent(long_name.replace(/ /g, '+'))
                                }
                            }
                        })
                    }
                    const qs = objectToUrlParams(params)
                    
                    location.href = '/map?' + qs
                }
            });
        }

        document.querySelectorAll('[data-style]').forEach(el => {
            el.style = el.dataset.style
        })
    }
    // end of initializePlacesAutocomplete`;
}
