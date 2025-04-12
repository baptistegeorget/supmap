"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";

export default function Page() {
  const [userData, setUserData] = useState({ email: "", username: "", picture: "" });
  const [statsData, setStatsData] = useState<any>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");

  const isDateRangeValid = new Date(startDate) <= new Date(endDate);

  // Token setup
  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Impossible de récupérer les données utilisateur");
          const data = await response.json();
          setUserData({ email: data.email, username: data.name, picture: data.picture || "" });
        } catch (error) {
          console.error("Erreur utilisateur :", error);
        }
      }
    }

    fetchUserData();
  }, [token]);

  // ✅ La fonction est bien avant le return
  const fetchStatsData = async (): Promise<void> => {
    if (token && startDate && endDate && isDateRangeValid) {
      setLoading(true);
      const startParam = `${startDate}T00:00:00Z`;
      const endParam = `${endDate}T23:59:59Z`;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/1/stats?start=${startParam}&end=${endParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error("Impossible de récupérer les stats");
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error("Erreur stats :", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const totalIncidents = statsData
    ? Number(statsData.total_accidents) +
      Number(statsData.total_traffic_jams) +
      Number(statsData.total_road_closed) +
      Number(statsData.total_police_control) +
      Number(statsData.total_roadblock)
    : "-";

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

      {/* Filtres de date */}
      <div className="filters_container">
        <div className="filters_container--filter">
          <label htmlFor="startDate" className="text-gray-600">Date de début</label>
          <input
            type="date"
            id="startDate"
            className="border rounded p-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filters_container--filter">
          <label htmlFor="endDate" className="text-gray-600">Date de fin</label>
          <input
            type="date"
            id="endDate"
            className="border rounded p-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Bouton de recherche */}
        <div className="filters_container--filter mt-2">
          <button
            className={`bg-customOrange text-white px-4 py-2 rounded ${!isDateRangeValid || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={fetchStatsData}
            disabled={!isDateRangeValid || loading}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </div>
      </div>

      <div className="analysis_content">
        <div className="analysis_content--kpis">
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Nombre de trajets</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_routes ?? "-"}</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Distance moyenne des trajets</h2>
            <p className="kpi">{loading ? "..." : statsData?.average_distance_km ? `${statsData.average_distance_km} km` : "-"}</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Temps moyen des trajets</h2>
            <p className="kpi">{loading ? "..." : statsData?.average_time ?? "-"}</p>
          </div>

          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2">Nombre de signalements</h2>
            <p className="kpi">{loading ? "..." : totalIncidents}</p>
          </div>
        </div>

        <div className="analysis_content--diagrams">
          {/* Tes futurs graphiques ici */}
        </div>
      </div>
    </div>
  );
}
