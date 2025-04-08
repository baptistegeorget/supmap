import { useState } from "react";
import { ArrowsUpDownIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

const API_KEY = process.env.NEXT_PUBLIC_GRAPHHOPPER_API_KEY;

interface Suggestion {
  housenumber?: string;
  name: string;
  city: string;
  point: {
    lat: number;
    lng: number;
  };
}


// Fonction pour appeler l'API de géocodage avec un délai de 10 secondes
const getGeocodingSuggestions = async (query: string) => {
  const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(query)}&locale=fr&limit=5&key=${API_KEY}`;
  console.log("Fetching geocoding suggestions from:", url);
  const response = await fetch(url);
  const data = await response.json();
  return data.hits || [];
};

const RouteForm = ({
  from,
  to,
  setFrom,
  setTo,
  setFromCoords,
  setToCoords,
  handlePreview,
  handleSendToMobile,
  isPreviewed,
  errorMessage,
  swapFields,
}: {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  fromCoords: { lat: number; lng: number } | null;
  toCoords: { lat: number; lng: number } | null;
  setFromCoords: (coords: { lat: number; lng: number } | null) => void;
  setToCoords: (coords: { lat: number; lng: number } | null) => void;
  handlePreview: () => void;
  handleSendToMobile: () => void;
  isPreviewed: boolean;
  errorMessage: string;
  swapFields: () => void;
}) => {
  const [fromSuggestions, setFromSuggestions] = useState<Suggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Suggestion[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);

  // Recherche d'adresses avec un délai
  const handleSearch = (query: string, setSuggestions: (suggestions: Suggestion[]) => void) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (inputTimeout) {
      clearTimeout(inputTimeout);
    }

    const timeout = setTimeout(async () => {
      const results = await getGeocodingSuggestions(query);
      setSuggestions(results);
    }, 2000); // Délai de 2 secondes

    setInputTimeout(timeout);
  };

  // Sélection d'une adresse
  const handleAddressSelect = (
    address: Suggestion,
    setAddress: (value: string) => void,
    setCoords: (coords: { lat: number; lng: number } | null) => void,
    setSuggestions: (suggestions: Suggestion[]) => void
  ) => {
    const { lat, lng } = address.point;
    const formattedAddress = address.housenumber
      ? `${address.housenumber} ${address.name}, ${address.city}`
      : `${address.name}, ${address.city}`;

    setAddress(formattedAddress);
    setCoords({ lat, lng });
    setSuggestions([]);
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-2/3 max-w-lg p-4 flex flex-col items-center bg-white rounded-lg shadow-md">
      <div className="flex w-full">
        <div className="flex flex-col w-full">
          {/* Champ "De" */}
          <div className="flex items-center relative mb-2 group">
            <span className="absolute left-4 text-customPurple font-medium group-focus-within:text-customOrange group-hover:text-customOrange">
              De :
            </span>
            <input
              type="text"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                handleSearch(e.target.value, setFromSuggestions);
              }}
              placeholder="Départ"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
            {/* Liste de suggestions "De" sous le champ */}
            {fromSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg mt-1 z-50 shadow-md">
                {fromSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      handleAddressSelect(suggestion, setFrom, setFromCoords, setFromSuggestions)
                    }
                  >
                    {suggestion.housenumber} {suggestion.name}, {suggestion.city}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Champ "Vers" */}
          <div className="flex items-center relative mb-2 group">
            <span className="absolute left-4 text-customPurple font-medium group-focus-within:text-customOrange group-hover:text-customOrange">
              Vers :
            </span>
            <input
              type="text"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                handleSearch(e.target.value, setToSuggestions);
              }}
              placeholder="Destination"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
            {/* Liste de suggestions "Vers" sous le champ */}
            {toSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-lg mt-1 z-50 shadow-md">
                {toSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      handleAddressSelect(suggestion, setTo, setToCoords, setToSuggestions)
                    }
                  >
                    {suggestion.housenumber} {suggestion.name}, {suggestion.city}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bouton Intervertir */}
        <div className="flex items-center ml-3">
          <button
            onClick={swapFields}
            aria-label="Intervertir"
            className="flex items-center justify-center swapButton"
          >
            <ArrowsUpDownIcon className="w-7 h-7 text-customPurple hover:text-customOrange transition-all" />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="mt-2 w-full text-red-500 font-bold text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Bouton Voir mon trajet */}
      <button
        className="mt-4 w-full px-4 py-2 text-white bg-customPurple hover:bg-customOrange rounded-md shadow-md transition-all flex items-center justify-center gap-2"
        onClick={handlePreview}
      >
        Voir mon trajet
      </button>

      {/* Bouton Envoyer vers mobile */}
      {isPreviewed && (
        <button
          className="mt-2 w-full px-4 py-2 text-white bg-customPurple hover:bg-customOrange rounded-md shadow-md transition-all flex items-center justify-center gap-2"
          onClick={handleSendToMobile}
        >
          Envoyer vers mobile <DevicePhoneMobileIcon className="w-6" />
        </button>
      )}
    </div>
  );
};

export default RouteForm;
