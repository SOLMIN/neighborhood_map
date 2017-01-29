var map;
var myObservableArray;
var markers = [];
var openInfowindow;
var bounds;

//initialize the map
function initMap() {
    //styles 
    var styles = [{
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
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 25.609543,
            lng: 85.082076
        },
        zoom: 14,
        styles: styles,
    });
    mapMarkers();



}
//to add the map markers
function mapMarkers() {

    fsContent = null;
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    bounds = new google.maps.LatLngBounds();
    openInfowindow = new google.maps.InfoWindow();
    var defaultIcon = makeMarkerIcon('462E84');

    /* Create a "highlighted location" marker color for when the user
      mouses over the marker. */
    var highlightedIcon = makeMarkerIcon('FFFF24');

    for (i = 0, len = locations.length; i < len; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var address = locations[i].address;
        var ph = locations[i].ph;

        var venueId = locations[i].venueId;
        var fourSquare = "https://api.foursquare.com/v2/venues/" + venueId + "?&client_id=BRFKH0SY4PTSOQM35DBETLTRV45IC3NB1UFNITXBVLYWDVW1&client_secret=YRM4NBJR3QR5P3ZX1SQ1IPFDACMBPEPP4CLLCJEYKK4KPFE5&v=20161016";

        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            address: address,
            ph: ph,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: fourSquare
        });
        markers.push(marker);
        marker.addListener('click', function() {
            dataInfobox(this, openInfowindow);
        });
        bounds.extend(markers[i].position);

        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });


    }
    map.fitBounds(bounds);

}

window.onload = function() {
	if ($(window).width() < 768){
		$('.slimScrollDiv').css('display', 'none');
	}
	
	function updateMarkers(list) {
        console.log(list.length);
        for (var i = 0, len = markers.length; i < len; i++) {
            markers[i].setMap(null);
        }
        for (var i = 0, len = list.length; i < len; i++) {
            console.log(list[i].title);
            markers[list[i].id].setMap(map);
        }
    }


    google.maps.event.addDomListener(window, 'resize', function() {
        map.fitBounds(bounds); // `bounds` is a `LatLngBounds` object
    });

    //--------------------------------------------------------------------------------------------
    //---------------------------Main Knockout Part ----------------------------------------------
    //--------------------------------------------------------------------------------------------
    function knockout() {



        //debugger;
        var self = this;
        self.searchBox = ko.observable('');
        self.locList = ko.observableArray([]);


        //Adding all locations to the  array and ordered list	
        locations.forEach(function(item) {
            self.locList.push(item);

        });

        self.locListClone = self.locList;



        self.locListClone = ko.computed(function() {
            //debugger;
            var query = this.searchBox().toLowerCase();
            if (!query) {
                return this.locList();
            } else {
                return ko.utils.arrayFilter(this.locList(), function(item) {
                    return indexOfs(item.title.toLowerCase(), query)
                });
            }
        }, self);

        //Filtered Markers 
        updateMarker = this.searchBox().toLowerCase();
        self.updateMarker = ko.computed(function() {
            if (!updateMarker) {
                updateMarkers(new self.locListClone);
            } else if (updateMarker) {
                updateMarkers(new self.locListClone);
            }
        });


        var indexOfs = function(string, indexOf) {
            string = string || '';
            //debugger;
            if (indexOf.length > string.length)
                return false;
            return string.substring(0, indexOf.length) === indexOf;
        };

        self.loadLocationInfo = function(locationInfo) {
            //debugger;
            dataInfobox(markers[locationInfo.id], openInfowindow);
        };

        self.clickMe = function clickMe() {

            if ($('#locList').css('display') == 'none') {
                $('#locList').show();
                $('#sideMenu').css('height', '100%');
                $('.slimScrollDiv').css('display', 'block');
            } else {
                $('#locList').hide();
                $('#sideMenu').css('height', '120px');
                $('.slimScrollDiv').css('display', 'none');

            }

        }
    };
    //applying bindings ko function
    ko.applyBindings(new knockout());
};
// This function takes in a COLOR, and then creates a new marker
// icon of that color. 
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
//populating info window based on marker
function dataInfobox(marker, infowindow) {
    //debugger;


    if (infowindow.marker !== marker) {
        // For having a blank Info box to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        //It will close info window after closing infowindow .
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        //For paranoma images within 30 meters 
        var radius = 30;
        //GetStreetView Main function
        // If street view is found then show the image. 
        function getStreetView(data, status) {
            var fourSquare = marker.id;
            if (status === google.maps.StreetViewStatus.OK && !fsContent) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div style= "color:#462E84" ><b>' + marker.title + '</b></div><div style= "color:#462E84">' + marker.address + '</div><div style= "color:#462E84">' + marker.ph + '</div><br><div id="pano"></div>');

                //--------------------------------------------------------------------------------------------------
                //------------------------------FourSquare Part ----------------------------------------------------
                //--------------------------------------------------------------------------------------------------

                var initContent = infowindow.getContent() + '<div id="fcContent"><p style= "color:#000"><b>Four Square Content :- </b></p></div>';
                var loadContent = initContent + '<div id="fsPhotos"><p style= "color:#ff0000">LOADING. . .</p></div>';
                infowindow.setContent(loadContent);
                $.ajax({
                    url: fourSquare,
                    dataType: 'json',
                    success: function(data) {
                        console.log(data);
                        infowindow.setContent(initContent);
                        var updatedContent = initContent + '<div class="fsPhotos">';

                        var placeLocation = data.response.venue.location.address;
                        //debugger;
                        !!data.response.venue.location.address ? placeLocation = data.response.venue.location.address : placeLocation = 'No place Location provided';

                        updatedContent = updatedContent + '<p style= "color:#462E84"><b>Address </b>' + placeLocation + "</p>";
                        updatedContent = updatedContent + '<p style= "color:#462E84">Photos from FourSquare are as follows :- </p><div class="fs-photo">';

                        var fourSquare = data.response.venue.canonicalUrl;
                        var photo = data.response.venue.photos.groups[0].items;
                        !!photo ? photo = photo : photo = 'No photo provided';
                        for (var i = 0; i < 4; i++) {
                            updatedContent = updatedContent + '<a target="_blank" href="' + fourSquare + '"><img src="' + photo[i].prefix + '100x100' + photo[i].suffix + '"></a>';
                        }
                        updatedContent = updatedContent + '</div></div>';
                        infowindow.setContent(updatedContent);
                    },
                    //in case photoes are not available in Foursquare at that moment or the user's internet is  not working properlly .
                    error: function() {
                        var errorMsg = '<p style= "color:#462E84">Photos cannot be found. Please try agin after some time. </p>';
                        infowindow.setContent(errorMsg);
                    }
                });

                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);



            } else {
                // In case Street view is not found then display the "No street view found message"
                infowindow.setContent('<div style= "color:#462E84" ><b>' + marker.title + '</b></div><div style= "color:#462E84">' + marker.address + '</div><div style= "color:#462E84">' + marker.ph +
                    '</div><br><div style= "color:#ff0000">No Street View Found</div><hr>');
                //--------------------------------------------------------------------------------------------------
                //------------------------------FourSquare Part ----------------------------------------------------
                //--------------------------------------------------------------------------------------------------

                if (!fsContent) {
                    var initContent = infowindow.getContent() + '<div id="fcContent"><p style= "color:#000"><b>Four Square Content :- </b></p></div>';
                    var loadContent = initContent + '<div id="fsPhotos"><p style= "color:#ff0000">LOADING. . .</p></div>';
                    infowindow.setContent(loadContent);
                    $.ajax({
                        url: fourSquare,
                        dataType: 'json',
                        success: function(data) {
                            console.log(data);
                            infowindow.setContent(initContent);
                            var updatedContent = initContent + '<div class="fsPhotos">';

                            var placeLocation = data.response.venue.location.address;
                            //debugger;
                            !!data.response.venue.location.address ? placeLocation = data.response.venue.location.address : placeLocation = 'No place Location provided';

                            updatedContent = updatedContent + '<p style= "color:#462E84"><b>Address </b> <br>' + placeLocation + "</p><br>";
                            updatedContent = updatedContent + '<p style= "color:#462E84">Photos from FourSquare are as follows :- </p><div class="fs-photo">';

                            var fourSquare = data.response.venue.canonicalUrl;
                            var photo = data.response.venue.photos.groups[0].items;
                            !!photo ? photo = photo : photo = 'No photo provided';
                            for (var i = 0; i < 4; i++) {
                                updatedContent = updatedContent + '<a target="_blank" href="' + fourSquare + '"><img src="' + photo[i].prefix + '50x50' + photo[i].suffix + '"></a>';
                            }
                            updatedContent = updatedContent + '</div></div>';
                            infowindow.setContent(updatedContent);
                        },
                        //in case photoes are not available in Foursquare at that moment or the user's internet is  not working properlly .
                        error: function() {
                            var errorMsg = '<p style= "color:#462E84">Photos cannot be found. Please try agin after some time. </p>';
                            infowindow.setContent(errorMsg);
                        }
                    });
                }
            }
        }
        // Streetview service to get the closest streetview image. 
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);


    }

    infowindow.open(map, marker);
    map.setZoom(18);
    map.setCenter(marker.getPosition());
    // when the location is clicked its marker will bounce for 3,000 ms
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 4200); //bounce for 4200/700 = 6 Bounce 

}
// Incase Google map is not able to load then it will be the error msg.

function mapError() {
    alert('Failed to Upload Google Map. Please Try again Later.');
};