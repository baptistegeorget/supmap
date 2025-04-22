"use client";

import { useState, useEffect } from "react";
import Cookie from "js-cookie";
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

interface StatsData {
  total_routes: number;
  average_distance_km: number;
  total_time: string;
  average_time: string;
  total_signalements: number;
  total_accidents: number;
  total_traffic_jams: number;
  total_road_closed: number;
  total_police_control: number;
  total_roadblock: number;
}

interface Route {
  created_on: string;
}

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function Page() {
  // States utilisateur et token
  const [userData, setUserData] = useState({ id: "", email: "", username: "", picture: "" });
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Statss filtres dates
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const isDateRangeValid = new Date(startDate) <= new Date(endDate);

  // Stats data
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [routesPerMonthData, setRoutesPerMonthData] = useState<number[]>(Array(12).fill(0));
  const [incidentCounts, setIncidentCounts] = useState({
    signalements: 0,
    accidents: 0,
    trafficJams: 0,
    roadClosed: 0,
    policeControl: 0,
    roadblock: 0,
  });

  // Récupération token
  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);

  // Récupération utilisateur
  useEffect(() => {
    async function fetchUserData() {
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Impossible de récupérer les données utilisateur");
          const data = await response.json();
          setUserData({
            id: data.id,
            email: data.email,
            username: data.name,
            picture: data.picture || "",
          });
        } catch (error) {
          console.error("Erreur utilisateur :", error);
        }
      }
    }

    fetchUserData();
  }, [token]);

  // Fonction pour récupérer les trajets
  const fetchRoutesData = async (): Promise<Route[]> => {
    if (!token || !userData.id || !startDate || !endDate || !isDateRangeValid) return [];

    const startParam = `${startDate}T00:00:00Z`;
    const endParam = `${endDate}T23:59:59Z`;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.id}/routes?start=${startParam}&end=${endParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Impossible de récupérer les trajets");

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur routes :", error);
      return [];
    }
  };

  // Regroupement des trajets par mois
  const countRoutesPerMonth = (routes: Route[]) => {
    const counts = Array(12).fill(0);
    routes.forEach((route) => {
      const date = new Date(route.created_on);
      const month = date.getMonth();
      counts[month]++;
    });
    return counts;
  };

  // Fonction principale de récupération des stats
  const fetchStatsData = async (): Promise<void> => {
    if (token && userData.id && startDate && endDate && isDateRangeValid) {
      setLoading(true);
      const startParam = `${startDate}T00:00:00Z`;
      const endParam = `${endDate}T23:59:59Z`;

      try {
        // Récupérer les stats globales
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.id}/stats?start=${startParam}&end=${endParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!statsResponse.ok) throw new Error("Impossible de récupérer les stats");
        const stats = await statsResponse.json();
        setStatsData(stats);

        // Mises à jour des incidents
        setIncidentCounts({
          signalements: stats?.total_signalements || 0,
          accidents: stats?.total_accidents || 0,
          trafficJams: stats?.total_traffic_jams || 0,
          roadClosed: stats?.total_road_closed || 0,
          policeControl: stats?.total_police_control || 0,
          roadblock: stats?.total_roadblock || 0,
        });

        // Récupérer les routes et compter par mois
        const routes = await fetchRoutesData();
        const routesPerMonthCounts = countRoutesPerMonth(routes);
        setRoutesPerMonthData(routesPerMonthCounts);
      } catch (error) {
        console.error("Erreur stats :", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Calcul total incidents
  // const totalIncidents = Object.values(incidentCounts).reduce((acc, val) => acc + val, 0);

  // Données du Pie Chart des incidents
  const incidentChartData = {
    labels: [
      'Accidents',
      'Embouteillages',
      'Routes fermées',
      'Contrôles de police',
      'Barrages',
    ],
    datasets: [
      {
        data: [
          incidentCounts.accidents,
          incidentCounts.trafficJams,
          incidentCounts.roadClosed,
          incidentCounts.policeControl,
          incidentCounts.roadblock,
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Données du Bar Chart des trajets par mois
  const routesPerMonthChartData = {
    labels: [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    datasets: [
      {
        label: 'Nombre de trajets',
        data: routesPerMonthData,
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex flex-col px-4 py-4 h-full w-full bg-gray-50 overflow-hidden analyse_container">
      <div className="analyse_header">
        <div className="analyse_header--welcome">
          <h1 className="text-2xl font-bold">
            Bienvenue <span className="text-customOrange">{userData.username}</span>
          </h1>
          <p className="text-gray-600">Gardez un oeil sur vos données de navigation</p>
        </div>
        <div className="analyse_header--date analyse_header--date--desktop">
          <span className="date text-gray-600">
          le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="analyse_header--date analyse_header--date--responsive">
          <span className="date text-gray-600">
            {new Date().toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Filtres de date */}
      <div className="filters_container">
        <div className="filters_input">
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
        </div>
        <div className="filters_container--filter filters_container--filter--button">
          <button
            className={`bg-customOrange text-white px-4 py-2 rounded ${!isDateRangeValid || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={fetchStatsData}
            disabled={!isDateRangeValid || loading}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="analysis_content">
        <div className="analysis_content--kpis">
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Trajets effectués</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_routes ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Distance moyenne</h2>
            <p className="kpi">{loading ? "..." : statsData?.average_distance_km ? `${statsData.average_distance_km} km` : "-"}</p>
            
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Durée totale</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_time ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Durée moyenne</h2>
            <p className="kpi">{loading ? "..." : statsData?.average_time ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Signalements</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_signalements ?? "-"}</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="analysis_content--diagrams">
          <div className="diagram_card">
            <h2 className="kpis_card--h2">Répartition des incidents</h2>
            <Pie data={incidentChartData} />
          </div>
          <div className="diagram_card">
            <h2 className="kpis_card--h2">Nombre de trajets par mois</h2>
            <Bar data={routesPerMonthChartData} />
          </div>
        </div>
      </div>
    </div>
  );
}
