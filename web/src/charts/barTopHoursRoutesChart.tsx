import { ChartOptions } from "chart.js";

export const barTopHoursRoutesChartData = (top5Hours: { hour: number; total_routes: number }[]) => ({
  labels: top5Hours.map(d => `${d.hour}h`),
  datasets: [
    {
      label: "Nombre de trajets",
      data: top5Hours.map(d => d.total_routes),
      backgroundColor: "rgba(16, 185, 129, 0.5)", // vert émeraude
      borderColor: "rgb(16, 185, 129)",
      borderWidth: 1,
    },
  ],
});

export const barTopHoursRoutesChartOptions: ChartOptions<"bar"> = {
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
          return `${value} trajet${value > 1 ? "s" : ""}`;
        },
      },
    },
  },
  animation: {
    duration: 1000,
    easing: "easeOutBounce",
  },
};
