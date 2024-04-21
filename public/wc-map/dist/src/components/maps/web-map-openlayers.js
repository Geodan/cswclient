import '../../../node_modules/@lit/reactive-element/reactive-element.js';
import { html as x } from '../../../node_modules/lit-html/lit-html.js';
import '../../../node_modules/lit-element/lit-element.js';
import Map from '../../../node_modules/ol/Map.js';
import GeoJSON from '../../../node_modules/ol/format/GeoJSON.js';
import View from '../../../node_modules/ol/View.js';
import { fromLonLat } from '../../../node_modules/ol/proj.js';
import { WebMap } from './web-map.js';
import { fetchText } from '../../utils/fetchdata.js';
import VectorSource from '../../../node_modules/ol/source/Vector.js';
import VectorLayer from '../../../node_modules/ol/layer/Vector.js';

class WebMapOpenLayers extends WebMap {

  render() {
    return x`
      <style>
        ${WebMapOpenLayers.externalStyles}
      </style>
      <div id="map"></div>
    `;
  }

  static externalStyles = '';

  async connectedCallback() {
    super.connectedCallback();
    this.status = 'web-map-openlayers connected to the DOM';
    try {
      // Fetch and apply the external CSS
      if (!WebMapOpenLayers.externalStyles) {
        this.status = 'web-map-openlayers fetching external CSS';
        WebMapOpenLayers.externalStyles = await fetchText('https://cdn.jsdelivr.net/npm/ol@v8.2.0/ol.css');          
        this.status = 'web-map-openlayers external CSS fetched';
        this.requestUpdate();
      }  
      // Add the map
      const worldSource = new VectorSource({
        url: './data/world.geo.json',
        format: new GeoJSON(),
        attributions: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>'
      });
      const worldLayer = new VectorLayer({
        source: worldSource
      });

      const lonLat = [5.1, 52.3522];
      const webMercator = fromLonLat(lonLat);
      const map = new Map({
        target: this.shadowRoot.querySelector('#map'),
        layers: [worldLayer],
        view: new View({
          center: webMercator,
          zoom: 5
        })
      });
      map.once('rendercomplete', () => {
        this.status = 'web-map-openlayers ready';
        this.dispatchEvent(new CustomEvent('map-ready'));
        console.log('web-map-openlayers map-ready event dispatched');
      });
    } catch (error) {
      console.error('web-map-openlayers error:', error.message);
      this.status = error.message;
    }
  }
}

customElements.define('web-map-openlayers', WebMapOpenLayers);

export { WebMapOpenLayers };
//# sourceMappingURL=web-map-openlayers.js.map
