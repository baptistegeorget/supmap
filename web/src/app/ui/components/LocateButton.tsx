import React from "react";
import Image from "next/image";

interface LocateButtonProps {
  setPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  mapRef: React.RefObject<google.maps.Map | null>;
}

const LocateButton = ({ setPosition, mapRef }: LocateButtonProps) => {
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([longitude, latitude]);

          if (mapRef.current) {
            const newCenter = new google.maps.LatLng(latitude, longitude);
            mapRef.current.setCenter(newCenter);
            mapRef.current.setZoom(13);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
        }
      );
    }
  };

  return (
    <div className="absolute right-3 top-[calc(45%+120px)] transform -translate-y-1/2 z-30 flex flex-col gap-0 text-customPurple">
      <button
        className="w-10 h-10 rounded-[25px] text-xl cursor-pointer m-0"
        onClick={handleLocate}
      >
        <Image
          src="/recentrer.png"
          alt="Recentrer"
          width={40}
          height={40}
          className="rounded-[10px] object-cover hover:opacity-80"
        />
      </button>
    </div>
  );
};

export default LocateButton;
