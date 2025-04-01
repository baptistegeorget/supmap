import { useEffect, useRef, useState } from "react";

interface MapComponentProps {
  position: [number, number] | null;
  route: [number, number][] | null;
  mapRef: React.RefObject<google.maps.Map | null>;
}

const loadGoogleMaps = (callback: () => void) => {
  if (window.google) {
    callback(); // Si Google Maps est déjà chargé, on l’utilise directement
    return;
  }
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  console.log("Google Maps script loaded:", script.src);
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
};

const MapComponent = ({ position, route, mapRef }: MapComponentProps) => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const routePathRef = useRef<google.maps.Polyline | null>(null);
  const [isGoogleMapsLoaded, setGoogleMapsLoaded] = useState(false);

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
    if (isGoogleMapsLoaded && position && mapRef.current) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      markerRef.current = new google.maps.Marker({
        position: { lat: position[1], lng: position[0] },
        map: mapRef.current,
        icon: {
          url: "/pins_supmap.png",
          scaledSize: new google.maps.Size(27, 32),
        },
      });
    }
  }, [isGoogleMapsLoaded, position]);

  useEffect(() => {
    if (isGoogleMapsLoaded && route && mapRef.current) {
      if (routePathRef.current) {
        routePathRef.current.setMap(null);
      }
      routePathRef.current = new google.maps.Polyline({
        path: route.map(([lng, lat]) => ({ lat, lng })),
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: mapRef.current,
      });
    }
  }, [isGoogleMapsLoaded, route]);

  return <div ref={mapDivRef} className="h-full w-full z-0"></div>;
};

export default MapComponent;
