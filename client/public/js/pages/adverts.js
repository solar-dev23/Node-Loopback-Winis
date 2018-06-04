/**
 * A function that is called from Google Maps after initialization
 *
 * @abstract
  */
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });

  var infowindow = new google.maps.InfoWindow;
  var bounds  = new google.maps.LatLngBounds();
  var markers = [];

  var addMarker = function(location, title, icon) {
    var loc = new google.maps.LatLng(location[0], location[1]);

    var marker = new google.maps.Marker({
      position: loc,
      title: title,
      map: map,
      icon: {
        path: icon,
        scale: 0.5,
        strokeWeight: 0.2,
        strokeColor: 'black',
        strokeOpacity: 1,
        fillColor: '#ff0000',
        fillOpacity: 1
      }
    });
    google.maps.event.addListener(marker, 'click', (function(marker) {
      return function() {
        infowindow.setContent(title);
        infowindow.open(map, marker);
      }
    })(marker, i));
    markers.push(marker);
    bounds.extend(loc);

    return marker;
  };

  for(var i = 0; i < advertLocations.length; i++) {
    var advertLocation = advertLocations[i];

    if (advertLocation.address) {
      addMarker(advertLocations[i].address, advertLocations[i].title + ' (Address)', fontawesome.markers.MAP_MARKER);
    }

    if (advertLocation.location) {
      addMarker(advertLocations[i].location, advertLocations[i].title + ' (GPS)', fontawesome.markers.LOCATION_ARROW);
    }
  }

  var options = {
    imagePath: 'img/maps/m',
    maxZoom: 13
  };

  new MarkerClusterer(map, markers, options);

  map.fitBounds(bounds);
  map.panToBounds(bounds);
}

$(".href-row").css('cursor', 'pointer').click(function() {
  window.document.location = $(this).data("href");
});

$('#confirm-delete').on('show.bs.modal', function (e) {
  $(this).find('.btn-ok').attr('href', $(e.relatedTarget).data('href'));
});

$('#data').DataTable({
  "paging": true,
  "searching": true,
  "info": true,
  "scrollX": true,
  "order": [[ 5, "desc" ]],
  columnDefs: [
    {
      targets: 0,
      width: '5em',
      render: $.fn.dataTable.render.ellipsis( 10, true )
    },
    {
      targets: 1,
      width: '5em'
    },
    {
      targets: 3,
      width: '10em'
    },
    {
      targets: 4,
      width: '10em'
    },
    {
      targets: 5,
      width: '5em'
    }
  ]
});
