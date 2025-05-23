"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowsUpDownIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

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
  avoidTolls,
  setAvoidTolls,
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
  avoidTolls: boolean;
  setAvoidTolls: (val: boolean) => void;

}) => {
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const initAutocomplete = useCallback(() => {

    if (!window.google || !fromInputRef.current || !toInputRef.current) return;

    const fromAutocomplete = new window.google.maps.places.Autocomplete(fromInputRef.current, {
      types: ["geocode"],
      componentRestrictions: { country: ["fr", "de", "it", "es", "be", "nl", "lu", "ch", "at", "se", "no", "dk", "fi", "pl", "cz", "sk", "hu", "pt", "ie", "gr"] },
    });

    const toAutocomplete = new window.google.maps.places.Autocomplete(toInputRef.current, {
      types: ["geocode"],
      componentRestrictions: { country: ["fr", "de", "it", "es", "be", "nl", "lu", "ch", "at", "se", "no", "dk", "fi", "pl", "cz", "sk", "hu", "pt", "ie", "gr"] },
    });

    fromAutocomplete.addListener("place_changed", () => {
      const place = fromAutocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || "";
        setFrom(address);
        setFromCoords({ lat, lng });
      }
    });

    toAutocomplete.addListener("place_changed", () => {
      const place = toAutocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || "";
        setTo(address);
        setToCoords({ lat, lng });
      }
    });
  }, [setFrom, setFromCoords, setTo, setToCoords]);;

  useEffect(() => {
    if (typeof window !== "undefined" && !window.google) {
      const existingScript = document.querySelector("script[src^='https://maps.googleapis.com/maps/api/js']");
      if (existingScript && existingScript instanceof HTMLScriptElement) {
        existingScript.addEventListener("load", initAutocomplete);
      }
    } else {
      initAutocomplete();
    }
  }, [initAutocomplete]);

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
              ref={fromInputRef}
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Départ"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
          </div>

          {/* Champ "Vers" */}
          <div className="flex items-center relative mb-2 group">
            <span className="absolute left-4 text-customPurple font-medium group-focus-within:text-customOrange group-hover:text-customOrange">
              Vers :
            </span>
            <input
              ref={toInputRef}
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Destination"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
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

      <div className="w-full mt-4 flex flex-col items-start space-y-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={avoidTolls}
            onChange={() => setAvoidTolls(!avoidTolls)}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-customOrange rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-customPurple"></div>
          <span className="ml-3 text-sm font-medium text-gray-900">Eviter les péages</span>
        </label>
      </div>
    </div>
  );
};

export default RouteForm;
