import React from "react";

interface CustomZoomControlProps {
  mapRef: React.RefObject<google.maps.Map | null>;
}

const CustomZoomControl = ({ mapRef }: CustomZoomControlProps) => {
  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      if (typeof currentZoom === "number") {
        mapRef.current.setZoom(currentZoom + 1);
      }
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      if (typeof currentZoom === "number") {
        mapRef.current.setZoom(currentZoom - 1);
      }
    }
  };

  return (
    <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-30">
      <div className="flex flex-col w-9 h-20 bg-white border-2 border-gray-300 rounded-full shadow-md overflow-hidden">
        <button
          className="flex-1 flex items-center justify-center text-customPurple text-xl hover:text-customOrange hover:bg-gray-100 transition-colors"
          onClick={handleZoomIn}
          aria-label="Zoom In"
        >
          +
        </button>
        <hr className="border-gray-300" />
        <button
          className="flex-1 flex items-center justify-center text-customPurple text-xl hover:text-customOrange hover:bg-gray-100 transition-colors"
          onClick={handleZoomOut}
          aria-label="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
};

export default CustomZoomControl;
