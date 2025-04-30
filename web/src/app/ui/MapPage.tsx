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
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [id_route, setIdRoute] = useState<number | null>(null); // ID de l'itinéraire


  // Référence à la carte
  const mapRef = useRef<google.maps.Map | null>(null);

  const $token = localStorage.getItem("token") || Cookie.get("auth_token");
  
  // Récupérer la position actuelle de l'utilisateur
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([longitude, latitude]);
        },
        (err) => {
          console.warn("Géolocalisation refusée ou échouée:", err.message);
          // Fallback sur null pour que MapComponent utilise sa valeur par défaut (Paris)
          setPosition(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    } else {
      // Le navigateur ne supporte pas la géoloc
      console.warn("La géolocalisation n'est pas disponible.");
      setPosition(null);
    }
  }, []);
  

  // Récupérer l'itinéraire depuis l'API
  const fetchRoute = async () => {
    setIsLoadingRoute(true); 
    try {
      if (!fromCoords || !toCoords) {
        setErrorMessage("Veuillez sélectionner des adresses valides.");
        return;
      }

      let profile = "car";

      if (avoidTolls) {
        profile = "car_avoid_toll";
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
          profile: profile,
          points: [
            [fromCoords.lng, fromCoords.lat],
            [toCoords.lng, toCoords.lat],
          ],
        }),
      });


      const data = await routeResponse.json();

      if (!routeResponse.ok) {
        const apiErrorMessage = data?.message || "Erreur lors de la création de l'itinéraire.";
        throw new Error(apiErrorMessage);
      }

      console.log("Réponse de l'itinéraire:", data);

      // Mise à jour de l'état avec l'itinéraire et l'ID
      setIdRoute(data.id); // Enregistre l'ID de l'itinéraire
      setRoute(data.graphhopper_response); // Met à jour avec la réponse complète

    } catch (error: unknown) {  // Utilisation de `unknown` au lieu de `Error`
      if (error instanceof Error) {
        console.error("Erreur lors de la récupération de l'itinéraire:", error);
        setErrorMessage(error.message || "Une erreur inattendue est survenue.");
      } else {
        console.error("Erreur inconnue", error);
        setErrorMessage("Une erreur inattendue est survenue.");
      }
    }  finally {
      setIsLoadingRoute(false); // → toujours désactivé à la fin
    }  
  };

  // const sendToMobile = async () => {
  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sendToMobile`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ from, to }),
  //     });
  //     const data = await response.json();
  //     if (data.success) {
  //       alert("Itinéraire envoyé au mobile !");
  //     } else {
  //       alert("Échec de l'envoi au mobile.");
  //     }
  //   } catch (error) {
  //     console.error("Erreur lors de l'envoi vers mobile:", error);
  //     alert("Erreur lors de l'envoi vers mobile.");
  //   }
  // };

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
    // sendToMobile();
  };

  const swapFieldsWithCoords = () => {
    setFrom(to);
    setTo(from);
    setFromCoords(toCoords);
    setToCoords(fromCoords);
  };

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
        avoidTolls={avoidTolls}
        setAvoidTolls={setAvoidTolls}
      />

      <MapComponent position={position} route={route?.paths || []} mapRef={mapRef} /> {/* Passage des chemins via `route?.paths` */}

      <LocateButton setPosition={setPosition} mapRef={mapRef} />
      <CustomZoomControl mapRef={mapRef} />

      {isLoadingRoute && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white font-medium">Recherche en cours...</p>
          </div>
        </div>
      )}

      {showQRPopup && (
        <QRCodePopup id_route={id_route} onClose={() => setShowQRPopup(false)} />
      )}
    </div>
  );
};

export default MapPage;
