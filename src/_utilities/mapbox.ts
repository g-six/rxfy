//for each element with class of 'locations-map_population' add commas to number
// let population = document.querySelectorAll(".locations-map_population");
// population.forEach(function (pop) {
// 	let popNum = pop.innerHTML;
// 	let popNumCommas = popNum.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// 	pop.innerHTML = popNumCommas;
// });

//-----------MAPBOX SETUP CODE BELOW-----------
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!! REPLACE ACCESS TOKEN WITH YOURS HERE !!!
mapboxgl.accessToken = "pk.eyJ1Ijoibm9ydnZyIiwiYSI6ImNreXQ5N2M2ajFiaTQyc3BlbmNuMnc1aTIifQ.ysZ1NdFhK8VMQFfAvvDhog";
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// reate empty locations geojson object
let mapLocations = {
	type: "FeatureCollection",
	features: [],
};
let selectedMapLocations = [];
// Initialize map and load in #map wrapper
let map = new mapboxgl.Map({
	container: "map",
	style: "mapbox://styles/norvvr/ckyultx23000314qoa1uxwvg9",
	center: [-96, 38.5],
	zoom: 3.6,
});
// Adjust zoom of map for mobile and desktop
let mq = window.matchMedia("(min-width: 480px)");
if (mq.matches) {
	map.setZoom(3.6); //set map zoom level for desktop size
} else {
	map.setZoom(2.6); //set map zoom level for mobile size
}
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());
// Get cms items
let listLocations = document.getElementById("location-list").childNodes;
// For each colleciton item, grab hidden fields and convert to geojson proerty
function getGeoData() {
	listLocations.forEach(function (location) {
		let locationLat = location.querySelector("#locationLatitude").value;
		let locationLong = location.querySelector("#locationLongitude").value;
		let locationInfo = location.querySelector(".locations-map_card").innerHTML;
		let coordinates = [locationLong, locationLat];
		let locationID = location.querySelector("#locationID").value;
		let geoData = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: coordinates,
			},
			properties: {
				id: locationID,
				description: locationInfo,
			},
		};
		if (mapLocations.features.includes(geoData) === false) {
			mapLocations.features.push(geoData);
		}
	});
}
// Invoke function
getGeoData();
// define mapping function to be invoked later
function addMapPoints() {
	/* Add the data to your map as a layer */
	map.addLayer({
		id: "locations",
		type: "circle",
		/* Add a GeoJSON source containing place coordinates and information. */
		source: {
			type: "geojson",
			data: mapLocations,
		},
		paint: {
			"circle-radius": 8,
			"circle-stroke-width": 1,
			"circle-color": "#FFC700",
			"circle-opacity": 1,
			"circle-stroke-color": "white",
		},
	});
	// When a click event occurs on a feature in the places layer, open a popup at the
	// location of the feature, with description HTML from its properties.
	map.on("click", "locations", (e) => {
		// Copy coordinates array.
		const coordinates = e.features[0].geometry.coordinates.slice();
		const description = e.features[0].properties.description;
		// Ensure that if the map is zoomed out such that multiple
		// copies of the feature are visible, the popup appears
		// over the copy being pointed to.
		while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
		}
		new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
	});
	// Center the map on the coordinates of any clicked circle from the 'locations' layer.
	map.on("click", "locations", (e) => {
		map.flyTo({
			center: e.features[0].geometry.coordinates,
			speed: 0.5,
			curve: 1,
			easing(t) {
				return t;
			},
		});
	});
	// Change the cursor to a pointer when the mouse is over the 'locations' layer.
	map.on("mouseenter", "locations", () => {
		map.getCanvas().style.cursor = "pointer";
	});
	// Change it back to a pointer when it leaves.
	map.on("mouseleave", "locations", () => {
		map.getCanvas().style.cursor = "";
	});
}
//When map is loaded initialize with data
map.on("load", function (e) {
	addMapPoints();
});
</script>