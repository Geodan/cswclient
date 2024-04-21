import '../../../node_modules/@lit/reactive-element/reactive-element.js';
import { html as x } from '../../../node_modules/lit-html/lit-html.js';
import '../../../node_modules/lit-element/lit-element.js';
import { MapToolBase } from './map-tool-base.js';
import { MapToolBoundingboxHandlerFactory } from '../../factories/map-tool-boudingbox-handler-factory.js';
import { css as i } from '../../../node_modules/@lit/reactive-element/css-tag.js';

/**
  * @prop {String} for - The selector for the map to listen to
  * @attr lat - The latitude of the mouse position, set by the map
  * @attr lng - The longitude of the mouse position, set by the map
*/
class MapToolBoundingBox extends MapToolBase {
  static styles = [
      i`
      .scale-down {
        font-size: 80%;
      }`
  ]

  static get properties() {
    return {
      ...MapToolBase.properties,
      east: { type: Number, reflect: true},
      west: { type: Number, reflect: true},
      north: { type: Number, reflect: true},
      south: { type: Number, reflect: true}
    }
  }

  constructor() {
    super();
    this.lat = this.lng = null;
    this.markers = [];
  }

  connectedCallback() {
    super.connectedCallback();    
    if (this.webMapElement && !this.disabled) {
      this.activate();
    }
  }

  disconnectedCallback() {
    if (this.webMapElement && !this.disabled) {
      this.deactivate();
    }
    super.disconnectedCallback();
  }

  render() {
    if (this.disabled) {
      return x``;
    }
    if (!this.webMapElement) {
      return x`<div>${this.constructor.name}: No map element found</div>`;
    }
    return x`Boundingbox<br>
      <button @click="${()=>this.resetBbox()}">Reset to current map extent</button><br>
      west: ${this.west}, south: ${this.south}, east: ${this.east}, north:  ${this.north}`
  }

  activate() {
    if (!this.isActivated) {
      super.activate();
      this.east = this.west = this.north = this.south = null;
      this.webMapElement.addEventListener('map-update-boundingbox', this._boundUpdateBoundingBox);
      this.bboxHandler = MapToolBoundingboxHandlerFactory.getHandler(this.webMapElement);
      this.bboxHandler.createBoundingBox({west: this.west, south: this.south, east: this.east, north: this.north});
      this.isActivated = true;
    }
  }
  resetBbox() {
    this.bboxHandler.deleteBoundingBox();
    this.bboxHandler.createBoundingBox();
  }
  deactivate() {
    if (this.isActivated) {
      super.deactivate();
      this.webMapElement.removeEventListener('map-update-boundingbox', this._boundUpdateBoundingBox);
      this.bboxHandler.deleteBoundingBox();
      this.east = this.west = this.north = this.south = null;
      this.isActivated = false;
    }
  }

  updateBoundingBox(e) {
    let factor = this.prevFactor === undefined ? 7 : this.prevFactor;
    if (this.prevResolution !== this.webMapElement.resolution) {
      this.prevResolution = this.webMapElement.resolution;
      this.prevFactor = factor = -Math.round(Math.log10(this.webMapElement.resolution));
    }
    this.east = parseFloat(e.detail.east.toFixed(factor));
    this.west = parseFloat(e.detail.west.toFixed(factor));
    this.north = parseFloat(e.detail.north.toFixed(factor));
    this.south = parseFloat(e.detail.south.toFixed(factor));
  }
  _boundUpdateBoundingBox = (e) => this.updateBoundingBox(e)
}

customElements.define('map-tool-boundingbox', MapToolBoundingBox);

export { MapToolBoundingBox };
//# sourceMappingURL=map-tool-boundingbox.js.map
