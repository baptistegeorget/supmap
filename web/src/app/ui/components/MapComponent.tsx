import { useEffect, useRef, useState } from "react";

interface RouteSegment {
  points: string;
  time?: number;
  distance?: number;
}

interface MapComponentProps {
  position: [number, number] | null;
  route: RouteSegment[];
  mapRef: React.RefObject<google.maps.Map | null>;
}

const loadGoogleMaps = (callback: () => void) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
};

const formatDuration = (milliseconds: number) => {
  const minutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
};

const MapComponent = ({ position, route, mapRef }: MapComponentProps) => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const routePathRefs = useRef<google.maps.Polyline[]>([]);
  const [isGoogleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const allMarkersRef = useRef<google.maps.Marker[]>([]);
  const allPopupsRef = useRef<google.maps.OverlayView[]>([]);

  // 💡 Position par défaut (Paris)
  const defaultPosition: [number, number] = [2.3522, 48.8566];

  useEffect(() => {
    loadGoogleMaps(() => setGoogleMapsLoaded(true));
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && mapDivRef.current) {
      const center = position ?? defaultPosition;
      const map = new google.maps.Map(mapDivRef.current, {
        center: { lat: center[1], lng: center[0] },
        zoom: 13,
        disableDefaultUI: true,
      });
      mapRef.current = map;
    }
  }, [isGoogleMapsLoaded, position, mapRef]);

  useEffect(() => {
    if (isGoogleMapsLoaded && route && mapRef.current) {
      class CustomPopup extends google.maps.OverlayView {
        position: google.maps.LatLng;
        content: string;
        div: HTMLDivElement | null;

        constructor(position: google.maps.LatLng, content: string, map: google.maps.Map) {
          super();
          this.position = position;
          this.content = content;
          this.div = null;
          this.setMap(map);
        }

        onAdd() {
          this.div = document.createElement("div");
          this.div.innerHTML = this.content;
          this.div.style.position = "absolute";
          this.div.style.transform = "translate(-50%, -100%)";
          this.div.style.zIndex = "1";

          this.div.addEventListener("click", () => {
            allPopupsRef.current.forEach((popup) => {
              const customPopup = popup as CustomPopup;
              if (customPopup.div) customPopup.div.style.zIndex = "1";
            });
            this.div!.style.zIndex = "100";
          });

          const panes = this.getPanes();
          if (panes) {
            panes.floatPane.appendChild(this.div);
          }
        }

        draw() {
          const projection = this.getProjection();
          if (!projection || !this.div) return;

          const position = projection.fromLatLngToDivPixel(this.position);
          if (position) {
            this.div.style.left = `${position.x}px`;
            this.div.style.top = `${position.y}px`;
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }

      const decodePolyline = (encoded: string) => {
        if (google.maps.geometry && google.maps.geometry.encoding) {
          const path = google.maps.geometry.encoding.decodePath(encoded);
          return path.map((point: google.maps.LatLng) => ({
            lat: point.lat(),
            lng: point.lng(),
          }));
        } else {
          console.error("Google Maps Geometry library is not loaded.");
          return [];
        }
      };

      routePathRefs.current.forEach((polyline) => polyline.setMap(null));
      allMarkersRef.current.forEach((marker) => marker.setMap(null));
      allPopupsRef.current.forEach((marker) => marker.setMap(null));

      routePathRefs.current = [];
      allMarkersRef.current = [];
      allPopupsRef.current = [];

      const bounds = new google.maps.LatLngBounds();

      route.forEach((singleRoute, index) => {
        if (singleRoute && singleRoute.points) {
          const decodedRoute = decodePolyline(singleRoute.points);
          const polyline = new google.maps.Polyline({
            path: decodedRoute,
            geodesic: true,
            strokeColor: index === selectedRouteIndex ? "#3D2683" : "#F15B4E",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: mapRef.current,
            clickable: true,
            zIndex: index === selectedRouteIndex ? 100 : 0,
          });

          routePathRefs.current.push(polyline);
          decodedRoute.forEach((point) => bounds.extend(new google.maps.LatLng(point.lat, point.lng)));

          const startPoint = decodedRoute[0];
          const endPoint = decodedRoute[decodedRoute.length - 1];

          const startMarker = new google.maps.Marker({
            position: { lat: startPoint.lat, lng: startPoint.lng },
            map: mapRef.current,
            icon: {
              url: "/pins_supmap.png",
              scaledSize: new google.maps.Size(27, 32),
            },
            title: "Point de départ",
          });

          const endMarker = new google.maps.Marker({
            position: { lat: endPoint.lat, lng: endPoint.lng },
            map: mapRef.current,
            icon: {
              url: "/pins_supmap.png",
              scaledSize: new google.maps.Size(27, 32),
            },
            title: "Point d'arrivée",
          });

          allMarkersRef.current.push(startMarker, endMarker);

          if (singleRoute.time && singleRoute.distance) {
            const middleIndex = Math.floor(decodedRoute.length / 2);
            const middlePoint = decodedRoute[middleIndex];

            const durationLabel = formatDuration(singleRoute.time);
            const distanceInKm = (singleRoute.distance / 1000).toFixed(2);

            if (mapRef.current) {
              const infoPopup = new CustomPopup(
                new google.maps.LatLng(middlePoint.lat, middlePoint.lng),
                `<div style="
                  background: white;
                  padding: 8px;
                  border-radius: 8px;
                  box-shadow: 0px 2px 6px rgba(0,0,0,0.2);
                  text-align: center;
                  font-size: 14px;
                  font-weight: bold;
                ">
                  <span style="color: #3D2683;">${durationLabel}</span> <br>
                  <span style="color: #555;">${distanceInKm} km</span>
                </div>`,
                mapRef.current
              );

              allPopupsRef.current.push(infoPopup);
            }
          }

          google.maps.event.addListener(polyline, "click", () => {
            setSelectedRouteIndex(index);
          });
        }
      });

      if (routePathRefs.current.length > 0) {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [isGoogleMapsLoaded, route, selectedRouteIndex]);

  return <div ref={mapDivRef} className="h-full w-full z-0"></div>;
};

export default MapComponent;
