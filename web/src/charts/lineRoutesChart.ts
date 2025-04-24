import { ChartOptions } from "chart.js";

export const lineRoutesChartData = (monthlyCounts: number[]) => ({
  labels: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  datasets: [
    {
      label: 'Nombre de trajets',
      data: monthlyCounts,
      borderColor: '#F15B4E',
      backgroundColor: '#F15B4E',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
});

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
    easing: "easeInOutCirc",
  },
};
