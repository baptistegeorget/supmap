"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";
import { Bar, Line } from "react-chartjs-2";
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
} from "chart.js";
import { lineUsersChartData, lineUsersChartOptions } from "@/charts/lineUsersChart";
import { barTopDaysRoutesChartData, barTopDaysRoutesChartOptions } from "@/charts/barTopDaysRoutesChart";
import { barHoursChartData, barHoursChartOptions } from "@/charts/barTopHoursRoutesChart";
import { lineIncidentsChartData, lineIncidentsChartOptions } from "@/charts/lineIncidentsChart";

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

interface StatsData {
  total_users: number;
  total_routes: number;
  total_distance_km: number;
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

export default function AdminDashboard() {
  // const [userData, setUserData] = useState({ id: "", email: "", username: "", picture: "", role: "" });
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [monthlyUsersData, setMonthlyUsersData] = useState<number[]>(Array(12).fill(0));
  const [top5DaysRoutes, setTop5DaysRoutes] = useState<{ day: string; total_routes: number }[]>([]);
  const [top5HoursData, setTop5HoursData] = useState<{ hour: string; total_routes: number }[]>([]);
  const [monthlyIncidentsData, setMonthlyIncidentsData] = useState<number[]>(Array(12).fill(0));

  const [statsData, setStatsData] = useState<StatsData | null>(null);


  const isDateRangeValid = new Date(startDate) <= new Date(endDate);
  const router = useRouter();

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const cookieToken = Cookie.get("auth_token");
    setToken(localToken || cookieToken);
  }, []);

  const fetchAdminStats = async () => {
    if (!token || !isDateRangeValid) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/stats?start=${startDate}T00:00:00Z&end=${endDate}T23:59:59Z`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Erreur récupération stats admin");
      const data = await response.json();
      // setUserData({
      //   id: data.id,
      //   email: data.email,
      //   username: data.name,
      //   picture: data.picture || "",
      //   role: data.role,
      // });
      const monthlyUsersArray = Array(12).fill(0);
      if (data?.monthly_users) {
        data.monthly_users.forEach((item: { month: number; user_count: number }) => {
          monthlyUsersArray[item.month - 1] = item.user_count;
        });
      }
      setMonthlyUsersData(monthlyUsersArray);
      setMonthlyIncidentsData(() => {
        const dataArray = Array(12).fill(0);
        if (data.monthly_incidents) {
          data.monthly_incidents.forEach((item: { month: number; incident_count: number }) => {
            dataArray[item.month - 1] = item.incident_count;
          });
        }
        return dataArray;
      });
      setTop5DaysRoutes(data.top5_days_routes || []);
      setTop5HoursData(data.top5_hours_routes || []);

      setStatsData(data);
    } catch (error) {
      console.error("Erreur admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col px-4 py-4 h-full w-full bg-gray-50 overflow-auto analyse_container">
      <div className="analyse_header">
        <div className="analyse_header--welcome">
          <h1 className="text-2xl font-bold">
            Vue <span className="text-customOrange">administrateur</span>
          </h1>
          <p className="text-gray-600">{"Cette page vous permet de visualiser les données de l'ensemble de vos utilisateurs"}</p>
        </div>
        <div className="analyse_header--date analyse_header--date--desktop">
          <span className="date text-gray-600">
            le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>

          <div className="flex gap-4 mt-4 desktop_buttons">
            <button className="px-4 py-2  button_dashboard button_secondary" onClick={() => router.push("/analytics")}>
              Vue utilisateur
            </button>
            <button className="px-4 py-2 button_dashboard button_tertiary" onClick={() => router.push("/admin_dashboard")}>
              Vue admin
            </button>
          </div>
        </div>
        <div className="analyse_header--date analyse_header--date--responsive">
          <span className="date text-gray-600">
            {new Date().toLocaleDateString('fr-FR')}
          </span>

          <div className="flex gap-4 mt-4 responsive_buttons">
            <button className="px-4 py-2 button_dashboard button_secondary" onClick={() => router.push("/analytics")}>
              Vue utilisateur
            </button>
            <button className="px-4 py-2 button_dashboard button_tertiary" onClick={() => router.push("/admin_dashboard")}>
              Vue admin
            </button>
          </div>

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
            className={`button_dashboard button_primary px-4 py-2 ${!isDateRangeValid || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={fetchAdminStats}
            disabled={!isDateRangeValid || loading}
          >
            {loading ? "Chargement..." : "Rechercher"}
          </button>
        </div>
      </div>

      {/* KPI */}
      <h2 className="dashboard_h2 dashboard_h2--kpi">Quelques <span>chiffres</span>...</h2>
      <div className="analysis_content">
        <div className="analysis_content--kpis">
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">{"Nb d'utilisateurs"}</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_users ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Trajets effectués</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_routes ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Distance totale</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_distance_km ? `${statsData.total_distance_km} km` : "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Durée totale</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_time ?? "-"}</p>
          </div>
          <div className="analysis_content--kpis--card">
            <h2 className="kpis_card--h2 text-gray-600">Signalements</h2>
            <p className="kpi">{loading ? "..." : statsData?.total_signalements ?? "-"}</p>
          </div>
        </div>


        {/* Graphiques */}
        <h2 className="dashboard_h2 dashboard_h2--graphiques">Vos données en <span>graphiques</span></h2>
        <div className="analysis_content--diagrams">

          <div className="diagram_row">
            <div className="diagram_graph">
              <Line data={lineUsersChartData(monthlyUsersData)} options={lineUsersChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">{"Évolution du nombre d'utilisateurs"}</h3>
              <p>
                {"Le graphique ci-dessous montre l'évolution du nombre de nouveaux utilisateurs enregistrés chaque mois sur la plateforme."}
                {"Cette visualisation permet d'analyser la croissance de la base d'utilisateurs et de repérer les périodes d'augmentation ou de ralentissement."}
              </p>
            </div>
          </div>

          <div className="diagram_row--reverse">
            <div className="diagram_graph">
              <Bar data={barTopDaysRoutesChartData(top5DaysRoutes)} options={barTopDaysRoutesChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">Top 5 des jours avec le plus de trajets</h3>
              <p>
                {"Le graphique ci-dessus met en avant les journées où le plus grand nombre de trajets ont été réalisés. Chaque barre représente le nombre total de trajets enregistrés pour un jour spécifique."}
                {"Cela permet d'identifier les dates les plus actives et d'analyser les pics d'utilisation."}
              </p>
            </div>
          </div>

          <div className="diagram_row">
            <div className="diagram_graph">
              <Bar data={barHoursChartData(top5HoursData)} options={barHoursChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">Top 5 des heures avec le plus de trajets</h3>
              <p>
                {"Ce graphique présente les heures de la journée où le nombre de trajets est le plus élevé. Chaque barre représente une heure spécifique et le total de trajets associés."}
                {"Cela permet de mieux comprendre les pics d'activité tout au long de la journée."}
              </p>
            </div>
          </div>

          <div className="diagram_row--reverse">
            <div className="diagram_graph">
              <Line data={lineIncidentsChartData(monthlyIncidentsData)} options={lineIncidentsChartOptions} />
            </div>
            <div className="diagram_text">
              <h3 className="dashboard_h3">Incidents par mois</h3>
              <p>
                {"Ce graphique montre l'évolution mensuelle du nombre d'incidents enregistrés par les utilisateurs. Il permet de détecter les périodes plus sensibles et de suivre l'évolution générale de la sécurité routière au fil du temps."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
