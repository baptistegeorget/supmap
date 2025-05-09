// Fichier de configuration pour le graphique de l'évolution mensuelle des trajets
import { ChartOptions } from "chart.js";

export const lineRoutesChartData = (monthlyCounts: number[]) => {
  const monthLabels = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // On filtre les mois pour n'afficher que ceux jusqu'au mois actuel
  const currentMonthIndex = new Date().getUTCMonth();
  const filteredLabels = monthLabels.slice(0, currentMonthIndex + 1);
  const filteredCounts = monthlyCounts.slice(0, currentMonthIndex + 1);

  // On crée le jeu de données pour le graphique
  return {
    labels: filteredLabels,
    datasets: [
      {
        label: 'Nombre de trajets',
        data: filteredCounts,
        borderColor: '#F15B4E',
        backgroundColor: '#F15B4E',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
};

// Options pour le graphique de l'évolution mensuelle des trajets
// Ces options définissent l'apparence et le comportement du graphique
export const lineRoutesChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      title: {
        display: false,
        text: 'Nombre de trajets',
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: false,
        text: 'Mois',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
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
    easing: "easeInOutCirc",
  },
};
