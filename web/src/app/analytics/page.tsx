"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookie from "js-cookie";
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
} from 'chart.js';
import { lineRoutesChartData, lineRoutesChartOptions } from "@/charts/lineRoutesChart";
import { barIncidentsChartData, barIncidentsChartOptions } from "@/charts/barIncidentsChart";

interface RecommendedHour {
  quarter_hour: string;
  traffic_jams: number;
}

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
  recommended_hours: RecommendedHour[];
  monthly_routes: number[];
}

// interface Route {
//   created_on: string;
// }

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export default function Page() {
  // States utilisateur et token
  const [userData, setUserData] = useState({ id: "", email: "", username: "", picture: "", role: "" });
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // States filtres dates
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

  const router = useRouter();



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
            role: data.role,
          });
        } catch (error) {
          console.error("Erreur utilisateur :", error);
        }
      }
    }

    fetchUserData();
  }, [token]);

  // Fonction pour récupérer les trajets
  // const fetchRoutesData = async (): Promise<Route[]> => {
  //   if (!token || !userData.id || !startDate || !endDate || !isDateRangeValid) return [];

  //   const startParam = `${startDate}T00:00:00Z`;
  //   const endParam = `${endDate}T23:59:59Z`;

  //   try {
  //     const response = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userData.id}/routes?start=${startParam}&end=${endParam}`,
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     if (!response.ok) throw new Error("Impossible de récupérer les trajets");

  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.error("Erreur routes :", error);
  //     return [];
  //   }
  // };


  // Regroupement des trajets par mois
  // const countRoutesPerMonth = (routes: Route[]) => {
  //   const counts = Array(12).fill(0);
  //   routes.forEach((route) => {
  //     const date = new Date(route.created_on);
  //     const month = date.getUTCMonth();
  //     counts[month]++;
  //   });
  //   return counts;
  // };

 

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
        setRoutesPerMonthData(stats?.monthly_routes || []);

      } catch (error) {
        console.error("Erreur stats :", error);
      } finally {
        setLoading(false);
      }
    }
  };


  // AFFICHAGE
  return (
    <div className="flex flex-col px-4 py-4 h-screen w-full bg-gray-50 overflow-scroll analyse_container rounded-md">
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
          {userData.role === "admin" && (
            <div className="flex gap-4 mt-4 desktop_buttons">
              <button className="px-4 py-2  button_dashboard button_tertiary" onClick={() => router.push("/analytics")}>
                Vue utilisateur
              </button>
              <button className="px-4 py-2 button_dashboard button_secondary" onClick={() => router.push("/admin_dashboard")}>
                Vue admin
              </button>
            </div>
          )}
        </div>
        <div className="analyse_header--date analyse_header--date--responsive">
          <span className="date text-gray-600">
            {new Date().toLocaleDateString('fr-FR')}
          </span>
          {userData.role === "admin" && (
            <div className="flex gap-4 mt-4 responsive_buttons">
              <button className="px-4 py-2 button_dashboard button_tertiary" onClick={() => router.push("/analytics")}>
                Vue utilisateur
              </button>
              <button className="px-4 py-2 button_dashboard button_secondary" onClick={() => router.push("/admin_dashboard")}>
                Vue admin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTRES */}
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
            className={`button_dashboard button_primary px-4 py-2 ${!isDateRangeValid || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={fetchStatsData}
            disabled={!isDateRangeValid || loading}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </div>
      </div>

      {/* CIRCULATION */}
      {statsData?.recommended_hours && statsData.recommended_hours.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded circulation">
          <h3 className="font-bold mb-2">Conseil circulation :</h3>
          <p>
            Évitez de prendre la route autour de
            {" "}
            <strong>{statsData.recommended_hours[0].quarter_hour.replace(":", "h")}</strong>,
            {" "}
            <strong>{statsData.recommended_hours[1].quarter_hour.replace(":", "h")}</strong> ou
            {" "}
            <strong>{statsData.recommended_hours[2].quarter_hour.replace(":", "h")}</strong>,
            {" "}
            ce sont les créneaux où les embouteillages sont les plus fréquents sur la période sélectionnée.
          </p>
        </div>
      )}


      {/* KPI */}
      <h2 className="dashboard_h2 dashboard_h2--kpi">Quelques <span>chiffres</span>...</h2>
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


        {/* DATAVIZ */}
        <h2 className="dashboard_h2 dashboard_h2--graphiques">Vos données en <span>graphiques</span></h2>
        <div className="analysis_content--diagrams">

          <div className="diagram_row">
            <div className="diagram_graph">
              <Bar data={barIncidentsChartData(incidentCounts)} options={barIncidentsChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">Nombre de signalements par type</h3>
              <p>
                {"Le graphique ci-dessous présente la répartition des incidents signalés en fonction de leur type. Chaque barre représente un type d'incident rencontré sur les routes, parmi lesquels on retrouve les accidents, les embouteillages, les routes fermées, les contrôles de police et les barrages."}
                {"Ce visuel permet d'avoir un aperçu immédiat des types d'événements les plus fréquents sur la période sélectionnée."}
              </p>
            </div>
          </div>

          <div className="diagram_row--reverse">
            <div className="diagram_graph">
              <Line data={lineRoutesChartData(routesPerMonthData)} options={lineRoutesChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">Évolution mensuelle des trajets</h3>
              <p>
                {"Ce graphique en courbe met en lumière la répartition des trajets effectués au fil des mois. Chaque point représente le nombre total de trajets réalisés sur une période mensuelle, permettant d'identifier les pics d'activité ainsi que les périodes plus calmes."}
                {"Cette visualisation est idéale pour suivre les tendances d'utilisation, détecter les variations saisonnières, et ajuster ses prévisions ou ses ressources en conséquence."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
