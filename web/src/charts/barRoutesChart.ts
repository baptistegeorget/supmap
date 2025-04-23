import { ChartOptions } from "chart.js";

export const barRoutesChartData = (monthlyCounts: number[]) => ({
  labels: [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ],
  datasets: [
    {
      label: 'Nombre de trajets',
      data: monthlyCounts,
      backgroundColor: 'rgba(255, 159, 64, 0.5)',
      borderColor: 'rgb(255, 159, 64)',
      borderWidth: 1,
    },
  ],
});

export const barRoutesChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
      title: {
        display: true,
        text: 'Nombre de trajets',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Mois',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};
