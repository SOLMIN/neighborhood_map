var loctArray;
var map;
var markers = [];
var openInfobox;
var bounds;

//--------------------------------------------------------------------------------------------
//----------------------------------------Knockout Part---------------------------------------
//--------------------------------------------------------------------------------------------
var knockOut = function() {

    loctArray = ko.observableArray(locations);
    //add location name, address, phone num to the left list
    for (var i = 0; i < loctArray().length; i++) {
        var liItem = '<li>' + loctArray()[i].title + '<p><i>' + loctArray()[i].address + '</i></p><hr class="style14"></li>';
        // var liItem = '<li>' + loctArray()[i].title + '<p><i>' + loctArray()[i].address + '</i></p><div>'+loctArray()[i].ph+' </div><hr class="style14"></li>';
        $('#List').append(liItem);
    }
    //add searched  locations to the left list 
    this.searchedPlaces = function() {
        //debugger; //For debugging 
        var query = ($('#searchBox').val()).toLowerCase();
        this.searchBox = ko.observable(query);
        loctArray = new ko.observableArray();
        //If searchbox is empty then add all the locations to the location array . 
        if (this.searchBox() === '') {
            loctArray = ko.observableArray(locations);
        } else {
            // Else add all the filtered locatioons to the location array.	
            for (var k = 0; k < locations.length; k++) {
                var n = locations[k].title.toLowerCase().search(this.searchBox());
                if (n >= 0) {
                    loctArray.push(locations[k]);
                }
            }
        }
        $('#List').empty();
        //Display all the filtered locations with there address and phone num in the left list. 
        for (var j = 0; j < loctArray().length; j++) {
            var liItem = '<li>' + loctArray()[j].title + '<p><i>' + loctArray()[j].address + '</i></p><hr class="style14"></li>';
            $('#List').append(liItem);
        }
        //Adding map markers for only the filtered locations
        mapMarkers();
    };
};
ko.applyBindings(new knockOut());


/*-------------------------------------------------------------------------------
  -----------------------------------------Map Initialization--------------------
  -------------------------------------------------------------------------------
 */

function initMap() {
    //styles for the map 
    var mapStyles = [{
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{
            color: '#e85113'
        }]
    }, {
        featureType: 'transit.station',
        stylers: [{
                weight: 9
            },
            {
                hue: '#e85113'
            }
        ]
    }];
    //  To set the center location and zoom parameters when the app is loaded.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 25.609543,
            lng: 85.082076
        },
        zoom: 14,
        styles: mapStyles,
    });
    // To add the markers in the map when its loaded. 
    mapMarkers();


}
/*  --------------------------------------------------------------------------------------
    -----------------------------------------Add the markers in the map. -----------------
    --------------------------------------------------------------------------------------
*/
function mapMarkers() {

    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    bounds = new google.maps.LatLngBounds();
    openInfobox = new google.maps.InfoWindow();
    // Marker default color.
    var colorMarkers = makeMarkerIcon('462E84');
    // A mew  marker color when the user hover mouse over the marker.
    var color2Markers = makeMarkerIcon('FFFF24');

    for (num = 0; num < loctArray().length; num++) {
        var position = loctArray()[num].location;
        var title = loctArray()[num].title;
        var address = loctArray()[num].address;
        var ph = loctArray()[num].ph;

        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            address: address,
            ph: ph,
            animation: google.maps.Animation.DROP,
            icon: colorMarkers,
            id: num,

        });
        markers.push(marker);
        marker.addListener('click', function() {
            dataInfobox(this, openInfobox);
        });
        marker.addListener('click', function() {
            this.setIcon(color2Markers);
        });
        bounds.extend(markers[num].position);

        marker.addListener('mouseover', function() {
            this.setIcon(color2Markers);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(colorMarkers);
        });
    }
    map.fitBounds(bounds);
}



//-----------------------------------------------------------------------------------------------
//-------------------------open the InfoBox when the location is clicked from the left list.-----
//-----------------------------------------------------------------------------------------------

$('#List').click(function(view) {
    var indexNum = $(view.target).index();
    dataInfobox(markers[indexNum], openInfobox);
});


//-----------------------------------------------------------------------------------------------  
//------------------------Displaying the information in the InfoBox. ----------------------------
//-----------------------------------------------------------------------------------------------

function dataInfobox(marker, infobox) {
   // debugger;
    if (infobox.marker !== marker) {
        infobox.marker = marker;
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        //For streetView service  	
        function getStreetView(data, status) {
            if (status === google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infobox.setContent('<div style= "color:#462E84" ><b>' + marker.title + '</b></div><div style= "color:#462E84">' + marker.address + '</div><div style= "color:#462E84">' + marker.ph + '</div><br><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infobox.setContent('<div style= "color:#462E84" ><b>' + marker.title + '</b></div><div style= "color:#462E84">' + marker.address + '</div><div style= "color:#462E84">' + marker.ph +
                    '</div><br><div style= "color:#ff0000">No Street View Found</div>');
            }
        }
        // streetview service get the closest streetview image within 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infobox for the clicked location/marker. 
        infobox.open(map, marker);
        map.setZoom(18);
        map.setCenter(marker.getPosition());
        // when the location is clicked its marker will bounce for 3,000 ms
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 3000); //bounce for 3000 ms
    }

}
// ------------------------------------------------------------------------------------------------------
// ------------------------Function takes in a COLOR, and then creates a new marker icon of that color.-- 
// ------------------------------------------------------------------------------------------------------

function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}