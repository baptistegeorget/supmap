"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";

export default function Page() {
  const [userData, setUserData] = useState({ email: "", username: "", picture: "" });
  const [statsData, setStatsData] = useState<any>(null); // <= ajouter un state pour les stats
  const [token, setToken] = useState<string | undefined>(undefined);

  // Récupération du token depuis le localStorage ou le cookie
  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    // console.log("Token localStorage :", localToken);
    // console.log("Token cookie :", cookieToken);
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


  // Récupération des statistiques de l'utilisateur
  useEffect(() => {
    async function fetchStatsData() {
      if (token) {
        // console.log("Utilisation du token pour les stats :", token);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/1/stats?start=2025-04-01T00:00:00Z&end=2025-12-11T23:59:59Z`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Impossible de récupérer les stats");
          const data = await response.json();
          setStatsData(data);
        } catch (error) {
          console.error("Erreur stats :", error);
        }
      }
    }

    fetchStatsData();
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
            <h2 className="kpis_card--h2">Nombre de trajets</h2>
            <p className="kpi">
              {statsData?.total_routes ?? "-"}
            </p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Distance moyenne des trajets</h2>
            <p className="kpi">
              {statsData?.average_distance_km ?? "-"} km
            </p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Temps moyen des trajets</h2>
            <p className="kpi">
              {statsData?.average_time ?? "-"}
            </p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Nombre de signalements</h2>
            <p className="kpi">
              {statsData ? (
                Number(statsData.total_accidents) +
                Number(statsData.total_traffic_jams) +
                Number(statsData.total_road_closed) +
                Number(statsData.total_police_control) +
                Number(statsData.total_roadblock)
              ) : "-"}
            </p>
          </div>

        </div>

        <div className="analysis_content--diagrams">

        </div>
      </div>
    </div>
  );
}

