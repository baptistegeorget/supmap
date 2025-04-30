import { ChartOptions } from "chart.js";

const allMonthLabels = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export const lineUsersChartData = (monthlyUserCounts: number[]) => {
  const currentMonthIndex = new Date().getMonth(); // 0 pour janvier, 1 pour février, etc.

  return {
    labels: allMonthLabels.slice(0, currentMonthIndex + 1),
    datasets: [
      {
        label: "Nouveaux utilisateurs",
        data: monthlyUserCounts.slice(0, currentMonthIndex + 1),
        borderColor: "#3D2683",
        backgroundColor: "#3D2683",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
};

export const lineUsersChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      title: {
        display: false,
        text: "Nombre d'utilisateurs",
      },
    },
    x: {
      grid: { display: false },
      title: {
        display: false,
        text: "Mois",
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.raw as number;
          return `${value} utilisateur${value > 1 ? "s" : ""}`;
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
