import { useEffect, useRef } from "react";
import { Map as OLMap, View } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import { Icon, Style, Stroke } from "ol/style";

interface MapComponentProps {
  position: [number, number] | null;
  route: [number, number][] | null;
  mapRef: React.RefObject<OLMap | null>; // Ajouter mapRef aux props
}

const MapComponent = ({ position, route, mapRef }: MapComponentProps) => {
  const markerLayerRef = useRef<VectorLayer | null>(null);
  const routeLayerRef = useRef<VectorLayer | null>(null);

  // Initialiser la carte
  useEffect(() => {
    if (position) {
      const map = new OLMap({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat(position),
          zoom: 13,
        }),
        controls: [], // Supprimer les contrôles par défaut
      });
      mapRef.current = map; // Assigner la carte à mapRef

      // Couche pour les marqueurs
      const markerSource = new VectorSource();
      const markerLayer = new VectorLayer({
        source: markerSource,
      });
      map.addLayer(markerLayer);
      markerLayerRef.current = markerLayer;

      // Couche pour l'itinéraire
      const routeSource = new VectorSource();
      const routeLayer = new VectorLayer({
        source: routeSource,
        style: new Style({
          stroke: new Stroke({
            color: "#FF0000",
            width: 3,
          }),
        }),
      });
      map.addLayer(routeLayer);
      routeLayerRef.current = routeLayer;

      return () => {
        if (map.getTargetElement()) {
          map.setTarget(undefined);
        }
      };
    }
  }, [position, mapRef]);

  // Mettre à jour le marqueur
  useEffect(() => {
    if (position && markerLayerRef.current) {
      const markerSource = markerLayerRef.current.getSource();
      if (markerSource) {
        markerSource.clear();
        const marker = new Feature({
          geometry: new Point(fromLonLat(position)),
        });
        marker.setStyle(
          new Style({
            image: new Icon({
              src: "/pins_supmap.png",
              anchor: [0.5, 1],
              scale: 0.025,
            }),
          })
        );
        markerSource.addFeature(marker);
      }
    }
  }, [position]);

  // Mettre à jour l'itinéraire
  useEffect(() => {
    if (route && routeLayerRef.current) {
      const routeSource = routeLayerRef.current.getSource();
      if (routeSource) {
        routeSource.clear();
        const routeFeature = new Feature({
          geometry: new LineString(route),
        });
        routeSource.addFeature(routeFeature);
      }
    }
  }, [route]);

  return <div id="map" className="h-full w-full z-0"></div>;
};

export default MapComponent;