import { MaplibreglToolBoundingboxHandler } from '../map-handlers/maplibregl-tool-boundingbox-handler.js';

class MapToolBoundingboxHandlerFactory {
  static getHandler(mapInstance) {
    switch (mapInstance?.constructor?.name) {
      case 'WebMapLibreGL':
      case 'WebMapBoxGL':
        return new MaplibreglToolBoundingboxHandler(mapInstance);
      default:
        throw new Error("Unsupported map type");
    }
  }
}

export { MapToolBoundingboxHandlerFactory };
//# sourceMappingURL=map-tool-boudingbox-handler-factory.js.map
