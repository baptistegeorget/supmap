"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: string;
}


export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableValue, setEditableValue] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [valueKey, setValueKey] = useState("");
  const [userId, setUserId] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); 
  const [userData, setUserData] = useState({ email: "", username: "", picture: "" });
  const [token, setToken] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [isAdmin, setIsAdmin] = useState(false);


  async function fetchUserData(offsetValue = 0) {
    if (token) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Impossible de récupérer les données");

        const data = await response.json();
        setUserId(data.id);
        setUserData({ email: data.email, username: data.name, picture: data.picture || "" });

        if (data.role === "admin") {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users?limit=${Number(limit)}&offset=${Number(offsetValue)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const usersData = await response.json();
          console.log("Données des utilisateurs :", usersData);
          setAllUsers(usersData); // <- stocke les users
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des informations :", error);
      }
    }
  }

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      // Si le user est admin ou pas
      setIsAdmin(selectedUser.role === "admin");
    }
  }, [selectedUser]);
  
  useEffect(() => {
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
    setSelectedUser(null); // Réinitialise l'utilisateur sélectionné
  };


  const handleSave = async () => {
    if (selectedUser) {
      // Admin modifie un autre utilisateur
      if (newPassword !== confirmPassword) {
        setErrorMessage("Les mots de passe ne correspondent pas.");
        return;
      }
  
      const updatePayload: Record<string, string> = {
        name: selectedUser.name,
        email: selectedUser.email,
        role: isAdmin ? "admin" : "user",
      };
      if (newPassword.trim()) {
        updatePayload.password = newPassword;
      }
  
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatePayload),
        });
  
        const result = await res.json();
        if (!res.ok) throw new Error(result?.message || "Erreur lors de la mise à jour");
        console.log("Utilisateur mis à jour :", result);
        setIsModalOpen(false);
        setSelectedUser(null);
        window.location.reload();
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err);
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Une erreur inconnue est survenue");
        }
      }
    } else {
  
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

        const updatedData = await response.json();
        console.log("Données mises à jour :", updatedData);

        if (!response.ok) {
          const apiErrorMessage = updatedData?.message || "Erreur lors de la création de l'itinéraire.";
          throw new Error(apiErrorMessage);
        }

        setUserData({
          email: updatedData.email,
          username: updatedData.name,
          picture: updatedData.picture || "",
        });

        setIsModalOpen(false);
        setSelectedUser(null);
        window.location.href = "/";
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Erreur lors de la mise à jour :", error);
          setErrorMessage(error.message || "Une erreur est survenue lors de la mise à jour.");
        }
        else {
          console.error("Erreur inconnue", error);
          setErrorMessage("Une erreur inattendue est survenue lors de la mise à jour.");
        }
      }
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

      {/* Paramètres admin */}
      {allUsers.length > 0 && (
          <div className="bg-white p-5 rounded-lg shadow-md mb-5">
            <h2 className="text-customOrange text-lg border-customOrange border-b-2 pb-2 mb-5" style={{ textIndent: "10px" }}>
              Utilisateurs
            </h2>
            <div className="space-y-4 pl-4">
              {allUsers
                .filter((user) => user.id !== userId)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => (
                <div key={user.id} className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <button
                      className="bg-customPurple text-white px-4 py-1 rounded hover:bg-customOrange"
                      onClick={() => {
                        setSelectedUser(user); // on garde l'user sélectionné
                        setValueKey("admin"); // ou une autre clé si tu veux personnaliser
                        setEditableValue(user.name); // ou email par défaut
                        setIsModalOpen(true);
                      }}
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => {
                  const newOffset = Math.max(0, offset - limit);
                  setOffset(newOffset);
                  fetchUserData(newOffset);
                }}
                disabled={offset === 0} // Désactive si déjà à la première page
              >
                Précédent
              </button>

              {/* Numéro de page */}
              <span className="text-gray-700 font-semibold">
                Page {Math.floor(offset / limit) + 1}
              </span>

              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => {
                  const newOffset = offset + limit;
                  setOffset(newOffset);
                  fetchUserData(newOffset);
                }}
                disabled={allUsers.length < limit} // Désactive si moins d'éléments que le limit (fin)
              >
                Suivant
              </button>
            </div>

          </div>
        )}


      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-10 rounded-lg text-center w-[550px]">
            <h2 className="font-bold text-xl mb-6">Modifier l&apos;utilisateur</h2>

            <div className="mb-4">
              <input
                type="text"
                value={selectedUser.name}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev!, name: e.target.value }))
                }
                placeholder="Nom"
                className="w-4/5 p-2 border-b-2 border-[#3D2683] focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                value={selectedUser.email}
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev!, email: e.target.value }))
                }
                placeholder="Email"
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
            <div className="mb-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isAdmin}
                  onChange={() => setIsAdmin(!isAdmin)}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-customOrange rounded-full peer dark:bg-gray-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-customPurple"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Administrateur</span>
              </label>
            </div>


            {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}

            <button
              className="w-[210px] py-2 mt-4 mx-2 bg-[#F15B4E] text-white rounded-md hover:opacity-80"
              onClick={handleCloseModal}
            >
              Annuler
            </button>
            <button
              className="w-[210px] py-2 mt-4 mx-2 bg-[#3D2683] text-white rounded-md hover:opacity-80"
              onClick={handleSave}
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && !selectedUser && (
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
