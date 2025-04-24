import { ChartOptions } from "chart.js";

// Définition des couleurs personnalisées par type d'incident
const INCIDENT_TYPES = [
  { label: "Accidents", key: "accidents", color: "#3D2683", border: "#3D2683" },
  { label: "Embouteillages", key: "trafficJams", color: "#F15B4E", border: "#F15B4E" },
  { label: "Routes fermées", key: "roadClosed", color: "#56A3A6", border: "#56A3A6" },
  { label: "Contrôles de police", key: "policeControl", color: "#6C5A49", border: "#6C5A49" },
  { label: "Barrages", key: "roadblock", color: "#F3DFC1", border: "#F3DFC1" },
];

export const barIncidentsChartData = (incidentCounts: Record<string, number>) => {
  const enriched = INCIDENT_TYPES.map((type) => ({
    label: type.label,
    value: incidentCounts[type.key] || 0,
    backgroundColor: type.color,
    borderColor: type.border,
  }));

  const sorted = enriched.sort((a, b) => b.value - a.value); // tri décroissant

  return {
    labels: sorted.map((item) => item.label),
    datasets: [
      {
        label: "Signalements",
        data: sorted.map((item) => item.value),
        backgroundColor: sorted.map((item) => item.backgroundColor),
        borderColor: sorted.map((item) => item.borderColor),
        borderWidth: 1,
      },
    ],
  };
};

export const barIncidentsChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y", 
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: false },
      title: {
        display: false,
        text: "Nombre de signalements",
      },
    },
    y: {
      title: {
        display: false,
        text: "Type d’incident",
      },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.raw as number;
          return `${value} signalement${value > 1 ? "s" : ""}`;
        },
      },
    },
  },
  animation: {
    duration: 1000,
    delay(ctx) {
      return ctx.dataIndex * 150;
    },
    easing: "easeInOutCirc",
  },
};
