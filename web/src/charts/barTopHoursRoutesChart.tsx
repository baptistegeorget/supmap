import { ChartOptions } from "chart.js";

export const barHoursChartData = (top5HoursData: { hour: string; total_routes: number }[]) => ({
  labels: top5HoursData.map((item) => `${item.hour}h`),
  datasets: [
    {
      label: "Trajets",
      data: top5HoursData.map((item) => item.total_routes),
      backgroundColor: "#3B82F6",
      borderColor: "#1D4ED8",
      borderWidth: 1,
    },
  ],
});

export const barHoursChartOptions: ChartOptions<"bar"> = {
  indexAxis: "y", // ← rend le graphique horizontal
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
      grid: { display: false },
    },
    y: {
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
    duration: 1200,
    delay(ctx) {
      return ctx.dataIndex * 150; 
    },
    easing: "easeInOutQuart", 
  },
};
