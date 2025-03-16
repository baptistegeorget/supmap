import { useEffect, useState, useRef } from "react";
import { Map as OLMap } from "ol";
import MapComponent from "./components/MapComponent";
import CustomZoomControl from "./components/CustomZoomControl";
import LocateButton from "./components/LocateButton";
import RouteForm from "./components/RouteForm";
import QRCodePopup from "./components/QRCodePopup";
import { fromLonLat } from "ol/proj";

const MapPage = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPreviewed, setIsPreviewed] = useState(false);

  // Référence à la carte
  const mapRef = useRef<OLMap | null>(null);

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
  const fetchRoute = async (from: string, to: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/getRoute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to }),
      });
      const data = await response.json();
      if (data.success && data.route) {
        const routeCoordinates = data.route.map((coord: [number, number]) =>
          fromLonLat(coord)
        );
        setRoute(routeCoordinates);
      } else {
        setErrorMessage("Impossible de récupérer l'itinéraire.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'itinéraire:", error);
      setErrorMessage("Erreur lors de la récupération de l'itinéraire.");
    }
  };

  // Envoyer l'itinéraire vers le mobile
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

  // Gestion des événements
  const handlePreview = () => {
    if (from.trim() && to.trim()) {
      setIsPreviewed(true);
      setErrorMessage("");
      fetchRoute(from, to);
    } else {
      setIsPreviewed(false);
      setErrorMessage("Veuillez remplir les champs 'Départ' et 'Destination'.");
    }
  };

  const handleSendToMobile = () => {
    setShowQRPopup(true);
    sendToMobile();
  };

  const swapFields = () => {
    setFrom((prev) => {
      setTo(prev);
      return to;
    });
  };

  // Affichage conditionnel du chargement
  if (!position) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        Chargement de votre position...
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative">
      {/* Formulaire de saisie de l'itinéraire */}
      <RouteForm
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
        handlePreview={handlePreview}
        handleSendToMobile={handleSendToMobile}
        isPreviewed={isPreviewed}
        errorMessage={errorMessage}
        swapFields={swapFields}
      />

      {/* Carte */}
      <MapComponent position={position} route={route} mapRef={mapRef} />

      {/* Boutons de contrôle */}
      <LocateButton setPosition={setPosition} mapRef={mapRef} />
      <CustomZoomControl mapRef={mapRef} />

      {/* Pop-up QR Code */}
      {showQRPopup && (
        <QRCodePopup
          from={from}
          to={to}
          onClose={() => setShowQRPopup(false)}
        />
      )}
    </div>
  );
};

export default MapPage;