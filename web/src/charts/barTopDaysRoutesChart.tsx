// Fichier de configuration du graphique à barres pour les incidents
// Ce fichier est utilisé sur la page administrateur

import { ChartOptions } from "chart.js";

export const barTopDaysRoutesChartData = (top5Days: { day: string; total_routes: number }[]) => ({


  labels: top5Days.map(d => d.day),
  datasets: [
    {
      label: "Nombre de trajets",
      data: top5Days.map(d => d.total_routes),
      backgroundColor: "#F15B4E",
      borderColor: "#F15B4E",
      borderWidth: 1,
    },
  ],
});

// Options pour le graphique à barres des trajets par jour
// Ces options définissent l'apparence et le comportement du graphique
export const barTopDaysRoutesChartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      title: {
        display: false,
        text: "Nombre de trajets",
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: false,
        text: "Jour",
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.raw as number;
          return `${value} trajet${value > 1 ? "s" : ""}`;
        },
      },
    },
  },
  animation: {
    duration: 1000,
    delay(ctx) {
      return ctx.dataIndex * 150;
    },
    easing: "easeInOutQuart",
  },
};
