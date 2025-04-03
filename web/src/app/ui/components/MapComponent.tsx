import { useEffect, useRef, useState } from "react";


interface RouteSegment {
  points: string; // La chaîne encodée pour la géométrie de la route
  time?: number;  // La durée du trajet en millisecondes (optionnelle)
  distance?: number;  // La distance du trajet en metre (optionnelle)
}

interface MapComponentProps {
  position: [number, number] | null;
  route: RouteSegment[]; // Utilisation du type `RouteSegment[]` pour la route
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
  const allMarkersRef = useRef<google.maps.Marker[]>([]); // Stocke tous les marqueurs (départ, arrivée, temps)

  useEffect(() => {
    loadGoogleMaps(() => setGoogleMapsLoaded(true));
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && position && mapDivRef.current) {
      const map = new google.maps.Map(mapDivRef.current, {
        center: { lat: position[1], lng: position[0] },
        zoom: 13,
        disableDefaultUI: true,
      });
      mapRef.current = map;
    }
  }, [isGoogleMapsLoaded, position, mapRef]);

  useEffect(() => {
    if (isGoogleMapsLoaded && route && mapRef.current) {
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
  
      // 🧹 Nettoyage des anciennes polylines et marqueurs
      routePathRefs.current.forEach((polyline) => polyline.setMap(null));
      allMarkersRef.current.forEach((marker) => marker.setMap(null));
  
      routePathRefs.current = [];
      allMarkersRef.current = [];
  
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
  
          // ✅ Ajouter les marqueurs à la liste pour une suppression propre
          allMarkersRef.current.push(startMarker, endMarker);
  
          // 🔹 Ajout du label pour la durée du trajet
          if (singleRoute.time && singleRoute.distance) {
            const middleIndex = Math.floor(decodedRoute.length / 2);
            const middlePoint = decodedRoute[middleIndex];
  
            const durationLabel = formatDuration(singleRoute.time);

            // const distanceInKm = (singleRoute.distance / 1000).toFixed(2); // Arrondi à 2 décimales

            // const infoLabel = `${durationLabel}
            // ${distanceInKm} km`; 
  
            const timeMarker = new google.maps.Marker({
              position: { lat: middlePoint.lat, lng: middlePoint.lng },
              map: mapRef.current,
              label: {
                text: durationLabel,
                color: "#3D2683",
                fontSize: "12px",
                fontWeight: "bold",
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#FFFFFF",
                fillOpacity: 0.8,
                strokeWeight: 0,
                scale: 20,
              },
            });
  
            allMarkersRef.current.push(timeMarker);
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
