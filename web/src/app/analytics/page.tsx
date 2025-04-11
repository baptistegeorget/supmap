"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";

export default function Page() {
  const [userData, setUserData] = useState({ email: "", username: "", picture: "" });
  const [token, setToken] = useState<string | undefined>(undefined);

  // Récupération du token depuis le localStorage ou le cookie
  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);

  // Récupération des données de l'utilisateur
  useEffect(() => {
    async function fetchUserData() {
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Impossible de récupérer les données");

          const data = await response.json();
          setUserData({ email: data.email, username: data.name, picture: data.picture || "" });
        } catch (error) {
          console.error("Erreur lors de la récupération des informations :", error);
        }
      }
    }

    fetchUserData();
  }, [token]);

  return (
    <div className="flex flex-col px-4 py-4 h-full w-full bg-gray-50 overflow-hidden analyse_container">
      <div className="analyse_header">
        <div className="analyse_header--welcome">
          <h1 className="text-2xl font-bold">
            Bienvenue <span className="text-customOrange">{userData.username}</span>
          </h1>
          <p className="text-gray-600">Gardez un oeil sur vos données de navigation</p>
        </div>
        <div className="analyse_header--date">
          <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div className="analysis_content">

        <div className="analysis_content--kpis">
          <div className="analysis_content--kpis--card">
            <h2 className="text-lg font-bold">Total des trajets</h2>
            <p className="text-2xl font-bold">150</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="text-lg font-bold">Distance moyenne</h2>
            <p className="text-2xl font-bold">25 km</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="text-lg font-bold">Total des trajets</h2>
            <p className="text-2xl font-bold">150</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="text-lg font-bold">Distance moyenne</h2>
            <p className="text-2xl font-bold">25 km</p>
          </div>

        </div>

        <div className="analysis_content--diagrams">

        </div>
      </div>
    </div>
  );
}

