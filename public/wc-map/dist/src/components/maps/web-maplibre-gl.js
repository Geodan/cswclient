import '../../../node_modules/@lit/reactive-element/reactive-element.js';
import { html as x } from '../../../node_modules/lit-html/lit-html.js';
import '../../../node_modules/lit-element/lit-element.js';
import { WebMap } from './web-map.js';
import { fetchText } from '../../utils/fetchdata.js';
import '../internal/map-positioner.js';

class WebMapLibreGL extends WebMap {

  render() {
    return x`
      <style>
        ${WebMapLibreGL.externalStyles}
      </style>
      <div id="map"></div>
      <map-positioner>
        <slot name="top-left" slot="top-left"></slot>
        <slot name="top-center" slot="top-center"></slot>
        <slot name="top-right" slot="top-right"></slot>
        <slot name="middle-center" slot="middle-center"></slot>
        <slot name="bottom-left" slot="bottom-left"></slot>
        <slot name="bottom-center" slot="bottom-center"></slot>
        <slot name="bottom-right" slot="bottom-right"></slot>
      </map-positioner>
    `;
  }

  static externalStyles = '';

  async connectedCallback() {
    super.connectedCallback();
    this.status = 'web-maplibre-gl connected to the DOM';
    try {
      // Fetch and apply the external CSS
      if (!WebMapLibreGL.externalStyles) {
        this.status = 'web-maplibre-gl fetching external CSS';        
        // fetch maplibre-gl.css from unpkg.com
        fetchText('https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.css').then((text) => {
          WebMapLibreGL.externalStyles = text;
          this.status = 'web-maplibre-gl external CSS fetched';
          this.requestUpdate();
        });
      }
      // Inject the mapboxgl script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@4.0.0/dist/maplibre-gl.js';
      this.status = 'injecting MaplibreGL script';
      script.onload = async () => {
        this.status = 'MaplibreGL script loaded';
        try {
          // Add the map
          const map = new maplibregl.Map({
            container: this.shadowRoot.querySelector('#map'),
            style: {
              version: 8,
              center: [0, 0],
              zoom: 0,
              pitch: 0,
              sources: {},
              layers: []
            }
          });
          
          map.on('load', () => {
            this._map = map; // add the native map to WebMap
            this._maplibrary = maplibregl; // add the native map library to WebMap
            map.on('mousemove', (e) => {
              this.dispatchEvent(new CustomEvent('map-mousemove', 
              { 
                detail: {
                  originalEvent: e.originalEvent,
                  offsetX: e.point.x,
                  offsetY: e.point.y,
                  lat: e.lngLat.lat,
                  lng: e.lngLat.lng
                }
              }
            ));});
            map.on('click', (e) => {
              this.dispatchEvent(new CustomEvent('map-mouseclick', 
              { 
                detail: {
                  originalEvent: e.originalEvent,
                  offsetX: e.point.x,
                  offsetY: e.point.y,
                  lat: e.lngLat.lat,
                  lng: e.lngLat.lng
                }
              }
            ));});
            this.updateResolution();
            map.on('zoomend', () => {
              this.updateResolution();
              this.dispatchEvent(new CustomEvent('map-zoomend', { detail: { zoom: map.getZoom() } }));
            });
            this._mapReady();
          });
        } catch (error) {
          throw new Error(error.message);
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('web-maplibre-gl: ' + error.message);
      this.status = error.message;
      this.MaploadedReject(error.message);
    }
  }
  _addLayer(layer) {
    if (!this._map) {
      console.error('web-maplibre-gl: map not ready for addLayer');
      return;
    }
    if (!layer.source) {
      console.warn(`Layer ${layer.id} has no source`);
      return;
    }
    this._map.addLayer(layer);
  }
  getAngle (latlng1, latlng2) {
    const rad = Math.PI / 180,
        lat1 = latlng1.lat * rad,
        lat2 = latlng2.lat * rad,
        a = Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);
    return Math.acos(Math.min(a, 1)) / rad;
  }
  updateResolution() {
    if (!this._map) {
      return;
    }
    const map = this._map;
    const y = map._container.clientHeight / 2;
    this.resolution = this.getAngle(map.unproject([0, y]), map.unproject([1, y]));
  }
}

customElements.define('web-maplibre-gl', WebMapLibreGL);

export { WebMapLibreGL };
//# sourceMappingURL=web-maplibre-gl.js.map
