import '../../../node_modules/@lit/reactive-element/reactive-element.js';
import { html as x } from '../../../node_modules/lit-html/lit-html.js';
import '../../../node_modules/lit-element/lit-element.js';
import { WebMap } from './web-map.js';
import { fetchText } from '../../utils/fetchdata.js';
import '../internal/map-positioner.js';

class WebMapLeaflet extends WebMap {
  
  constructor() {
    super();
    this._map = null;
    this.status = 'web-map-leaflet constructor';
  }
  render() {
    return x`
      <style>
        ${WebMapLeaflet._externalStyles}
      </style>
      <div id="map"></div>
      <map-positioner z-index="1100">
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
  static _externalStyles = '';

  async connectedCallback() {
    super.connectedCallback();
    this.status = 'web-map-leaflet connected to the DOM';
    try {
      // Fetch and apply the external CSS when loaded
      if (!WebMapLeaflet._externalStyles) {
        this.status = 'web-map-leaflet fetching external CSS';
        fetchText('https://unpkg.com/leaflet@1.7.1/dist/leaflet.css').then((text) => {
          WebMapLeaflet._externalStyles = text;
          this.status = 'web-map-leaflet external CSS fetched';
          this.requestUpdate();
        });        
      }
      // Inject the Leaflet script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      this.status = 'injecting Leaflet script';
      script.onload = async () => {
        this.status = 'Leaflet script loaded';
        try {
          // Add the map
          this._map = new window.L.Map(this.shadowRoot.getElementById('map')).setView([52.3522, 5.1], 5);
          console.log('web-map-leaflet map-ready event dispatched');
          this.status = 'web-map-leaflet ready';
          this._mapReady();
        } catch (error) {
          this.status = error.message;
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('web-map-leaflet: ' + error.message);
      this.status = error.message;
    }
  }
  _nativeAddLayer(layer) {
    if (!this._map) {
      console.error('web-map-leaflet: map not ready for addLayer');
      return;
    }
    // add layer to leaflet map
    // to do: layerFactory
    const options = {};
    if (layer.source.attribution) {
      options.attribution = layer.source.attribution;
    }
    if (layer.source.tileSize) {
      options.tileSize = layer.source.tileSize;
    }
    if (layer.source.zoomOffset) {
      options.zoomOffset = layer.source.zoomOffset;
    }
    if (layer.source.minzoom) {
      options.minZoom = layer.source.minzoom;
    }
    if (layer.source.maxzoom) {
      options.maxNativeZoom = layer.source.maxzoom;
      options.maxZoom = layer.source.maxzoom;
    }
    if (layer.paint) {
      switch (layer.type) {
        case 'line':
          options.style = (_feature) => {
            return {
              stroke: layer.paint['line-color'] !== 'rgba(0, 0, 0, 0)',
              color: layer.paint['line-color'],
              weight: layer.paint['line-width'],
              opacity: layer.paint['line-opacity']
            }
          };
          options.style = {};
          options.style['stroke-color'] = layer.paint['line-color'];
          options.style.weight = layer.paint['line-width'];
          break;
        case 'fill':
          options.style = (_feature) => {
            return {
              stroke: layer.paint['fill-outline-color'] !== layer.paint['fill-color'],
              color: layer.paint['fill-outline-color'] ? layer.paint['fill-outline-color'] : layer.paint['fill-color'],
              weight: layer.paint['fill-outline-color'] ? 1 : 0,
              opacity: layer.paint['fill-opacity'],
              fill: true,
              fillColor: layer.paint['fill-color'],
              fillOpacity: layer.paint['fill-opacity']
            };
          };
          break;
        case 'circle':
          options.pointToLayer = (_feature, latlng) => {
            return window.L.circleMarker(latlng, {
              radius: layer.paint['circle-radius'],
              fillColor: layer.paint['circle-color'],
              color: layer.paint['circle-stroke-color'],
              weight: layer.paint['circle-stroke-width'],
              opacity: layer.paint['circle-opacity'],
              fillOpacity: layer.paint['circle-opacity']
            });
          };
          break;
        default:
          console.error(`web-map-leaflet: unsupported layer type for geojson: ${layer.type}`);
      }
    }
    if (layer.id) {
      options.id = layer.id;
    }
    switch (layer?.source?.type) {
      case 'geojson':
        window.L.geoJSON(layer.source.data, options).addTo(this._map);
        break;
      case 'raster':
        if (layer.source.tiles[0] === 'https://tile.openstreetmap.org/{z}/{x}/{y}.png') {
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', options).addTo(this._map);
        } else {
          window.L.tileLayer(layer.source.tiles[0], options).addTo(this._map);
        }
        break;
      default:
        console.error(`web-map-leaflet: unsupported layer type: ${layer.source.type}`);
    }
  }
  _nativeUpdateView() {
    this._map?.setView([this.lat, this.lon], this.zoom);
  }
  _nativeActivateEventListener(event) {
    console.log ('web-map-leaflet: registerNativeEvent for ' + event);
    if (this._map) {
      switch (event) {
        case 'map-mousemove':
          this._map.on('mousemove', (e) => {
            this.dispatchEvent(new CustomEvent('map-mousemove', { detail: {
                originalEvent: e.originalEvent,
                offsetX: e.containerPoint.x,
                offsetY: e.containerPoint.y,
                lat: e.latlng.lat,
                lng: e.latlng.lng
              }}
            ));
          });
          break;
      }
    } else {
      console.error ('web-map-leaflet: map not ready for ' + event);
    }
  }
}

customElements.define('web-map-leaflet', WebMapLeaflet);

export { WebMapLeaflet };
//# sourceMappingURL=web-map-leaflet.js.map
