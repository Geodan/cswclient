import { MapToolBoundingboxInterface } from '../interfaces/map-tool-boundingbox-interface.js';

// maplibregl-handler.js

class MaplibreglToolBoundingboxHandler extends MapToolBoundingboxInterface {
    constructor(mapInstance) {
        super();
        this.webMap = mapInstance;
    }
    createBoundingBox(userOptions = {
      west: null,
      south: null,
      east: null,
      north: null,
      markerColor: '#ffffff',
      markerBorderColor: '#333',
      bboxColor: 'red',
      bboxOpacity: 0.3,
      bboxBorderColor: 'red'
    }) { 
      const defaultOptions = {
        west: null,
        south: null,
        east: null,
        north: null,
        markerColor: '#ffffff',
        markerBorderColor: '#333',
        bboxColor: 'rgba(255, 0, 0, 0.3)',
        bboxOpacity: 1,
        bboxBorderColor: 'red'
      };
      // merge default options with user options
      const options = {...userOptions, ...defaultOptions};
      this.webMap.getMap().then((map, _maplibrary) => {
        if (options.west === null || options.south === null || options.east === null || options.north === null) {
          const bounds = map.getBounds();
          let west = bounds.getWest() >= -180 ? bounds.getWest() : -180;
          let south = bounds.getSouth() >= -90 ? bounds.getSouth() : -90;
          let east = bounds.getEast() <= 180 ? bounds.getEast() : 180;
          let north = bounds.getNorth() <= 90 ? bounds.getNorth() : 90;
          north -= (north - south) * 0.02; // 10% smaller bounding box (padding)
          south += (north - south) * 0.02; // 10% smaller bounding box (padding)
          west += (east - west) * 0.02; // 10% smaller bounding box (padding)
          east -= (east - west) * 0.02; // 10% smaller bounding box (padding)
          options.west = options.west === null ? west : options.west;
          options.south = options.south === null ? south : options.south;
          options.east = options.east === null ? east : options.east;
          options.north = options.north === null ? north : options.north;
        }
        this.marker1 = this.addMarker(options.west, options.south, options.markerColor, options.markerBorderColor);
        this.marker2 = this.addMarker(options.east, options.north, options.markerColor, options.markerBorderColor);
        this.bboxLayer = {
          id: 'bbox',
          type: 'fill',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [options.west, options.south],
                  [options.east, options.south],
                  [options.east, options.north],
                  [options.west, options.north],
                  [options.west, options.south]
                ]]
              }
            }
          },
          paint: {
            'fill-color': options.bboxColor,
            'fill-opacity': options.bboxOpacity,
            'fill-outline-color': 'red'
          }
        };
        map.addLayer(this.bboxLayer);
        this.updateBoundingBox();
      }); 
    }
    addMarker(lng, lat, color = '#ffffff', borderColor = '#333') {
      const el = document.createElement('div');
      el.style.backgroundColor = color; // color of the circle
      el.style.cursor = 'move'; // cursor style
      el.style.border = `2px solid ${borderColor}`; // border of the circle
      el.style.width = '15px'; // width of the circle
      el.style.height = '15px'; // height of the circle
      el.style.borderRadius = '50%'; // make the element a circle
      
      // Create a new marker with the custom element
      const marker = new this.webMap._maplibrary.Marker({
        element: el,
        draggable: true
      })
        .setLngLat([lng, lat]) // replace with your coordinates
        .addTo(this.webMap._map);
      
      // Add event listeners for the dragstart and dragend events
      marker.on('dragstart', () => {
        this.updateBoundingBox();
      });
      marker.on('drag', () => {
        this.updateBoundingBox();
      });
      marker.on('dragend', () => {
        this.updateBoundingBox();
      });
      
      marker.on('dragend', () => {
        var lngLat = marker.getLngLat();
        this.webMap.dispatchEvent(new CustomEvent('map-marker-dragend', { detail: {           
          lat: lngLat.lat,
          lng: lngLat.lng,
         } }));
      });
      return marker;
    }

    updateBoundingBox() {
      const marker1LngLat = this.marker1.getLngLat();
      const marker2LngLat = this.marker2.getLngLat();
      const west = Math.min(marker1LngLat.lng, marker2LngLat.lng);
      const south = Math.min(marker1LngLat.lat, marker2LngLat.lat);
      const east = Math.max(marker1LngLat.lng, marker2LngLat.lng);
      const north = Math.max(marker2LngLat.lat, marker2LngLat.lat);
      this.webMap.dispatchEvent(new CustomEvent('map-update-boundingbox', { detail: { west, south, east, north } }));
      this.webMap._map.getSource('bbox').setData({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south]
          ]]
        }
      });
    }

    deleteBoundingBox() {
      if (this.marker1) {
        this.marker1.remove();
      }
      if (this.marker2) {
        this.marker2.remove();
      }
      if (this.bboxLayer) {
        this.webMap._map.removeLayer('bbox');
      }
      if (this.webMap._map.getSource('bbox')) {
        this.webMap._map.removeSource('bbox');
      }
      this.marker1 = this.marker2 = this.bboxLayer = null;
      this.east = this.west = this.north = this.south = null;
    }

    updateMarker(markerId, lat, lng) {
        // Update logic specific to MaplibreGL
    }

    finalizeBoundingBox() {
        // Finalize bounding box for MaplibreGL
    }
}

export { MaplibreglToolBoundingboxHandler };
//# sourceMappingURL=maplibregl-tool-boundingbox-handler.js.map
