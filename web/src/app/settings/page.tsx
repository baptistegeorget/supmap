"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableValue, setEditableValue] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [valueKey, setValueKey] = useState("");
  const [userId, setUserId] = useState("");

  const [userData, setUserData] = useState({ email: "", username: "", picture: "" });

  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);
  
  useEffect(() => {
    async function fetchUserData() {
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Impossible de récupérer les données");

          const data = await response.json();
          setUserId(data.id);
          setUserData({ email: data.email, username: data.name, picture: data.picture || "" });
        } catch (error) {
          console.error("Erreur lors de la récupération des informations :", error);
        }
      }
    }

    fetchUserData();
  }, [token]);

  const handleButtonClick = (value: string, key: string) => {
    setEditableValue(value);
    setValueKey(key);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage("");
  };

  const handleSave = async () => {
    try {
      let updateData: Record<string, unknown> = {};

      if (valueKey === "mot de passe") {
        if (newPassword !== confirmPassword) {
          setErrorMessage("Les nouveaux mots de passe ne correspondent pas.");
          return;
        }
        updateData = { password: newPassword, currentPassword: oldPassword };
      } else if (valueKey === "email") {
        updateData = { email: editableValue };
      } else if (valueKey === "nom d'utilisateur") {
        updateData = { name: editableValue };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour");

      const updatedData = await response.json();
      setUserData({
        email: updatedData.email,
        username: updatedData.name,
        picture: updatedData.picture || "",
      });

      setIsModalOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setErrorMessage("Une erreur est survenue lors de la mise à jour.");
    }
  };

  if (!token) {
    return (
      <div className="p-5 bg-gray-50">
        {/* Profil */}
        <div className="bg-white p-5 rounded-lg shadow-md mb-5">
          <h2 className="text-customOrange text-lg border-customOrange border-b-2 pb-2 mb-5" style={{ textIndent: "10px" }}>
            Profil
          </h2>
          <div className="space-y-4 pl-4">
            <p className="w-full flex flex-col p-4 bg-gray-100 rounded-lg">
              <span className="font-bold">Adresse e-mail</span>
              <span className="text-gray-600">Veuillez vous connecter</span>
            </p>
            <p className="w-full flex flex-col p-4 bg-gray-100 rounded-lg">
              <span className="font-bold">Nom d’utilisateur</span>
              <span className="text-gray-600">Veuillez vous connecter</span>
            </p>
            <p className="w-full flex flex-col p-4 bg-gray-100 rounded-lg">
              <span className="font-bold">Mot de passe</span>
              <span className="text-gray-600">Veuillez vous connecter</span>
            </p>
          </div>
        </div>

        {/* Paramètres de navigation */}
        <div className="bg-white p-5 rounded-lg shadow-md mb-5">
          <h2 className="text-customOrange text-lg border-customOrange border-b-2 pb-2 mb-5" style={{ textIndent: "10px" }}>
            Paramètres de navigation
          </h2>
          <div className="space-y-4 pl-4">
            {["Partager sa position", "Éviter les péages", "Éviter les autoroutes", "Garder la carte orientée vers le nord"].map(
              (label, index) => (
                <div key={index} className="flex items-center py-2">
                  <span className="text-gray-800 mr-5">{label}</span>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="opacity-0 w-0 h-0" />
                    <span className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer transition-colors duration-300 ease-in-out">
                      <span className="block w-4 h-4 bg-white rounded-full absolute top-[4px] left-[3px] peer-checked:left-[calc(100%-19px)] transition-all duration-300 ease-in-out"></span>
                    </span>
                  </label>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gray-50">
      {/* Profil */}
      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-customOrange text-lg border-customOrange border-b-2 pb-2 mb-5" style={{ textIndent: "10px" }}>
          Profil
        </h2>
        <div className="space-y-4 pl-4">
          <button
            className="w-full flex flex-col p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
            onClick={() => handleButtonClick(userData.email, "email")}
          >
            <span className="font-bold">Adresse e-mail</span>
            <span className="text-gray-600">{userData.email}</span>
          </button>
          <button
            className="w-full flex flex-col p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
            onClick={() => handleButtonClick(userData.username, "nom d'utilisateur")}
          >
            <span className="font-bold">Nom d’utilisateur</span>
            <span className="text-gray-600">{userData.username}</span>
          </button>
          <button
            className="w-full flex flex-col p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
            onClick={() => handleButtonClick("*******", "mot de passe")}
          >
            <span className="font-bold">Mot de passe</span>
            <span className="text-gray-600">*******</span>
          </button>
        </div>
      </div>

      {/* Paramètres de navigation */}
      <div className="bg-white p-5 rounded-lg shadow-md mb-5">
        <h2 className="text-customOrange text-lg border-customOrange border-b-2 pb-2 mb-5" style={{ textIndent: "10px" }}>
          Paramètres de navigation
        </h2>
        <div className="space-y-4 pl-4">
          {["Partager sa position", "Éviter les péages", "Éviter les autoroutes", "Garder la carte orientée vers le nord"].map(
            (label, index) => (
              <div key={index} className="flex items-center py-2">
                <span className="text-gray-800 mr-5">{label}</span>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="opacity-0 w-0 h-0" />
                  <span className="relative inline-block w-12 h-6 bg-gray-300 rounded-full cursor-pointer transition-colors duration-300 ease-in-out">
                    <span className="block w-4 h-4 bg-white rounded-full absolute top-[4px] left-[3px] peer-checked:left-[calc(100%-19px)] transition-all duration-300 ease-in-out"></span>
                  </span>
                </label>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-10 rounded-lg text-center w-[550px]">
            <h2 className="font-bold text-xl mb-6">Modifier {valueKey}</h2>
            {valueKey === "mot de passe" ? (
              <div>
                <div className="mb-4">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Ancien mot de passe"
                    className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none"
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none"
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none"
                  />
                </div>
                {errorMessage && <div className="text-red-500">{errorMessage}</div>}
              </div>
            ) : (
              <input type="text" value={editableValue} onChange={(e) => setEditableValue(e.target.value)} className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none" />
            )}
            <button className="w-[210px] py-2 mt-6 mx-2 bg-[#F15B4E] text-white rounded-md hover:opacity-80" onClick={handleCloseModal}>
              Annuler
            </button>
            <button className="w-[210px] py-2 mt-6 mx-2 bg-[#3D2683] text-white rounded-md hover:opacity-80" onClick={handleSave}>
              Sauvegarder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
