import { useEffect, useState, useRef } from "react";
import MapComponent from "./components/MapComponent";
import CustomZoomControl from "./components/CustomZoomControl";
import LocateButton from "./components/LocateButton";
import RouteForm from "./components/RouteForm";
import QRCodePopup from "./components/QRCodePopup";
import Cookie from "js-cookie";


interface GraphhopperResponse {
  paths: {
    points: string; // Chaîne encodée pour chaque chemin
    time?: number;  // Temps du trajet pour ce chemin (optionnel)
    distance?: number;  // La distance du trajet en metre (optionnelle)
  }[];
}



const MapPage = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<GraphhopperResponse | null>(null); // Type `route` avec `GraphhopperResponse | null`
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPreviewed, setIsPreviewed] = useState(false);

  // Référence à la carte
  const mapRef = useRef<google.maps.Map | null>(null);

  const $token = Cookie.get("auth_token");

  // Récupérer la position actuelle de l'utilisateur
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([longitude, latitude]);
        },
        (err) => {
          console.error("Erreur de géolocalisation:", err);
        }
      );
    }
  }, []);

  // Récupérer l'itinéraire depuis l'API
  const fetchRoute = async () => {
    try {
      if (!fromCoords || !toCoords) {
        setErrorMessage("Veuillez sélectionner des adresses valides.");
        return;
      }

      // Étape 1: Appeler la route /auth/me pour récupérer l'ID utilisateur
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${$token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Impossible de récupérer l'utilisateur.");
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      // Étape 2: Récupérer l'itinéraire avec l'ID utilisateur
      const routeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${$token}`,
        },
        body: JSON.stringify({ 
          profile: "car",
          points: [
            [fromCoords.lng, fromCoords.lat],
            [toCoords.lng, toCoords.lat],
          ],
        }),
      });

      if (!routeResponse.ok) {
        throw new Error("Erreur lors de la création de l'itinéraire.");
      }

      const data = await routeResponse.json();
      console.log("Réponse de l'itinéraire:", data);

      // Mise à jour de l'état avec l'itinéraire
      setRoute(data.graphhopper_response); // Met à jour avec la réponse complète

    } catch (error) {
      console.error("Erreur lors de la récupération de l'itinéraire:", error);
      setErrorMessage("Erreur lors de la récupération de l'itinéraire.");
    }
  };

  const sendToMobile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sendToMobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Itinéraire envoyé au mobile !");
      } else {
        alert("Échec de l'envoi au mobile.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi vers mobile:", error);
      alert("Erreur lors de l'envoi vers mobile.");
    }
  };

  const handlePreview = () => {
    if (from.trim() && to.trim() && fromCoords && toCoords) {
      setIsPreviewed(true);
      setErrorMessage("");
      fetchRoute();
    } else {
      setIsPreviewed(false);
      setErrorMessage("Veuillez sélectionner des adresses valides.");
    }
  };

  const handleSendToMobile = () => {
    setShowQRPopup(true);
    sendToMobile();
  };

  const swapFieldsWithCoords = () => {
    setFrom(to);
    setTo(from);
    setFromCoords(toCoords);
    setToCoords(fromCoords);
  };

  if (!position) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Chargement de votre position...
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      <RouteForm
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        fromCoords={fromCoords}
        toCoords={toCoords}
        setFromCoords={setFromCoords}
        setToCoords={setToCoords}
        handlePreview={handlePreview}
        handleSendToMobile={handleSendToMobile}
        isPreviewed={isPreviewed}
        errorMessage={errorMessage}
        swapFields={swapFieldsWithCoords}
      />

      <MapComponent position={position} route={route?.paths || []} mapRef={mapRef} /> {/* Passage des chemins via `route?.paths` */}

      <LocateButton setPosition={setPosition} mapRef={mapRef} />
      <CustomZoomControl mapRef={mapRef} />

      {showQRPopup && (
        <QRCodePopup from={from} to={to} onClose={() => setShowQRPopup(false)} />
      )}
    </div>
  );
};

export default MapPage;
