// QRCodePopup.tsx
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const QRCodePopup = ({
  from,
  to,
  onClose,
}: {
  from: string;
  to: string;
  onClose: () => void;
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);


  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: 350,
      height: 350,
      data: `https://example.com/from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      image: "/logo_wt.png", // Chemin vers ton logo
      dotsOptions: {
        color: "#3D2683",
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        imageSize: 0.1, // Taille relative du logo
      },
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = ""; // Nettoie si déjà existant
      qrCode.current.append(qrRef.current);
    }
  }, [from, to]);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center relative">
        <h2 className="text-lg font-bold text-customPurple mb-4">
          Scannez ce QR code pour accéder à votre trajet sur mobile
        </h2>

        <div ref={qrRef} className="my-4" />

        <button
          className="mt-4 px-4 py-2 text-white bg-customPurple hover:bg-customOrange rounded-md shadow-md transition-all flex items-center justify-center gap-2"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default QRCodePopup;
