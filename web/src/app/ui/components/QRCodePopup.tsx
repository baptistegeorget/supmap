import { QRCodeCanvas } from "qrcode.react";

const QRCodePopup = ({
  from,
  to,
  onClose,
}: {
  from: string;
  to: string;
  onClose: () => void;
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <h2 className="text-lg font-bold text-customPurple mb-4">
          Scannez ce QR code pour accéder à votre trajet sur mobile
        </h2>
        <QRCodeCanvas
          className="m-5"
          value={`https://example.com/from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          size={200}
        />
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