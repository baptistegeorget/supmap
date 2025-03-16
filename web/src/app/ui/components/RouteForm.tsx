import { ArrowsUpDownIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

const RouteForm = ({
  from,
  to,
  setFrom,
  setTo,
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
  handlePreview: () => void;
  handleSendToMobile: () => void;
  isPreviewed: boolean;
  errorMessage: string;
  swapFields: () => void;
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 w-2/3 max-w-lg p-4 flex flex-col items-center bg-white rounded-lg shadow-md">
      <div className="flex w-full">
        <div className="flex flex-col w-full">
          <div className="flex items-center relative mb-2 group">
            <span className="absolute left-4 text-customPurple font-medium group-focus-within:text-customOrange group-hover:text-customOrange">
              De :
            </span>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Départ"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
          </div>
          <div className="flex items-center relative mb-2 group">
            <span className="absolute left-4 text-customPurple font-medium group-focus-within:text-customOrange group-hover:text-customOrange">
              Vers :
            </span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Destination"
              className="w-full pl-16 pr-8 py-2 bg-gray-100 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-customOrange focus:outline-none text-customPurple focus:text-customOrange hover:text-customOrange focus:border-customOrange hover:border-customOrange"
            />
          </div>
        </div>
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
      {errorMessage && (
        <div className="mt-2 w-full text-red-500 font-bold text-sm font-medium">
          {errorMessage}
        </div>
      )}
      <button
        className="mt-4 w-full px-4 py-2 text-white bg-customPurple hover:bg-customOrange rounded-md shadow-md transition-all flex items-center justify-center gap-2"
        onClick={handlePreview}
      >
        Voir mon trajet
      </button>
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