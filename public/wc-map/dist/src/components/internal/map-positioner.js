import '../../../node_modules/@lit/reactive-element/reactive-element.js';
import { html as x } from '../../../node_modules/lit-html/lit-html.js';
import { LitElement as s } from '../../../node_modules/lit-element/lit-element.js';
import { css as i } from '../../../node_modules/@lit/reactive-element/css-tag.js';

/**
 * @element map-positioner - An internal helper component to position elements on a map, through slots
 * 
 * @description - A component to position elements on top of a container, through slots
 * 
 * @slot top-left - The top left element
 * @slot top-center - The top center element
 * @slot top-right - The top right element
 * @slot middle-center - The middle center element
 * @slot bottom-left - The bottom left element
 * @slot bottom-center - The bottom center element
 * @slot bottom-right - The bottom right element
 * 
 * @prop {Number} zIndex - The optional z-index of slotted elements (default: undefined, 1100 is a good value for leaflet)
 * 
 * @example
 * <map-positioner>
 * <div slot="top-left">Top left</div>
 * <div slot="top-center">Top center</div>
 * <div slot="top-right">Top right</div>
 * <div slot="middle-center">Middle center</div>
 * <div slot="bottom-left">Bottom left</div>
 * <div slot="bottom-center">Bottom center</div>
 * <div slot="bottom-right">Bottom right</div>
 * </map-positioner>
 */
class MapPositioner extends s {
  constructor() {
    super();
    this.zIndex = undefined;
  }
  static get properties() {
    return {
      zIndex: { type: Number, attribute: 'z-index' }
    }
  }
  static styles = i`
  :host {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .outercontainer {
    position: relative;
    height: 100%;
    background: transparent;
    border: 1px solid black;
  }
  .top, .bottom, .left, .right, .middle {
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
  }
  .top {
    top: 0;
  }
  .bottom {
    bottom: 0;
  }
  .left {
    left: 0;
    background-color: lightblue;
  }
  .middle {
    top: 50%;
    transform: translateY(-50%);
  }
  .center {
    left: 50%;
    transform: translateX(-50%);
  }
  .right {
    right: 0;
    background-color: lightcoral;
  }`;
  _renderExtraStyles() {
    if (this.zIndex !== undefined) {
      return i`.outercontainer {z-index: ${this.zIndex};}`;
    }
    return '';
  }

  render() {
    return x`
        <style>
          ${this._renderExtraStyles()}
        </style>
        <div class="outercontainer">
        <div class="top left">
          <slot name="top-left"></slot>
        </div>
        <div class="top center">
          <slot name="top-center"></slot>
        </div>
        <div class="top right">
          <slot name="top-right"></slot>
        </div>
        <div class="middle center">
          <slot name="middle-center"></slot>
        </div>
        <div class="bottom left">
          <slot name="bottom-left"></slot>
        </div>
        <div class="bottom center">
          <slot name="bottom-center"></slot>
        </div>
        <div class="bottom right">
          <slot name="bottom-right"></slot>
        </div>
      </div>
    `;
  }
}
customElements.define('map-positioner', MapPositioner);

export { MapPositioner };
//# sourceMappingURL=map-positioner.js.map
