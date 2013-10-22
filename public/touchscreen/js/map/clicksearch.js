/*
** Copyright 2013 Google Inc.
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
**    http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
*/

define(
['config', 'bigl', 'stapes', 'googlemaps', 'sv_svc'],
function(config, L, Stapes, GMaps, sv_svc) {

  var SEARCH_FAIL_BALLOON_TIME = 1100;

  var ClickSearchModule = Stapes.subclass({
    constructor: function(map) {
      this.map = map;

      this.search_fail_balloon = new GMaps.InfoWindow({
        content: '<img src="icons/sv_fail.png" height="40" width="40" />',
        disableAutoPan: true
      });
      this.ballon_close_timeout = null;

      GMaps.event.addListener(this.map, 'click', function(event) {
        this.close_search_fail_balloon();

        // determine min/max search radius based on zoom level
        var min_search_radius;
        var max_search_radius;

        var current_zoom = this.map.getZoom();

        if (current_zoom <= 10) {
          min_search_radius = 400;
          max_search_radius = 1600;
        } else if (current_zoom <= 12) {
          min_search_radius = 100;
          max_search_radius = 400;
        } else if (current_zoom <= 14) {
          min_search_radius = 50;
          max_search_radius = 200;
        } else {
          min_search_radius = 50;
          max_search_radius = 50;
        }

        sv_svc.getPanoramaByLocation(
          event.latLng,
          min_search_radius,
          function(data, stat, search_latlng) {
            if(stat == GMaps.StreetViewStatus.OK) {
              this.emit('search_result', data);
            } else {
              this.open_search_fail_balloon(search_latlng);
            }
          }.bind(this),
          max_search_radius
        );
      }.bind(this));
    },

    open_search_fail_balloon: function(latlng) {
      this.close_search_fail_balloon();

      this.search_fail_balloon.setPosition(latlng);
      this.search_fail_balloon.open(this.map);

      this.balloon_close_timeout = setTimeout(
        this.close_search_fail_balloon.bind(this),
        SEARCH_FAIL_BALLOON_TIME
      );
    },

    close_search_fail_balloon: function() {
      clearTimeout(this.balloon_close_timeout);
      this.search_fail_balloon.close();
    },
  });

  return ClickSearchModule;
});
