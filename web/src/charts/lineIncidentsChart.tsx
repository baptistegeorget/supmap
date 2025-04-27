import { ChartOptions } from "chart.js";

export const lineIncidentsChartData = (monthlyIncidentsCounts: number[]) => {
  const monthLabels = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const currentMonthIndex = new Date().getMonth();
  
  return {
    labels: monthLabels.slice(0, currentMonthIndex + 1),
    datasets: [
      {
        label: "Nombre d'incidents",
        data: monthlyIncidentsCounts.slice(0, currentMonthIndex + 1),
        borderColor: "#F59E0B",
        backgroundColor: "#F59E0B",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
};

export const lineIncidentsChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
    },
    x: {
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.raw as number;
          return `${value} incident${value > 1 ? "s" : ""}`;
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
