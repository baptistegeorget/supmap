import { ChartOptions } from "chart.js";

export const barHoursChartData = (top5HoursData: { hour: string; total_routes: number }[]) => {
  const colors = [
    "#3D2683", 
    "#F15B4E", 
    "#56A3A6", 
    "#6C5A49", 
    "#F3DFC1", 
  ];

  return {
    labels: top5HoursData.map(item => item.hour),
    datasets: [
      {
        label: "Nombre de trajets",
        data: top5HoursData.map(item => item.total_routes),
        backgroundColor: colors, 
        borderWidth: 1,
      },
    ],
  };
};

export const barHoursChartOptions: ChartOptions<"bar"> = {
  indexAxis: 'y', 
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: false },
      title: {
        display: false,
      },
    },
    y: {
      grid: { display: false },
      title: {
        display: false,
      },
      ticks: {
        callback: function (value, index, ticks) {
          const label = this.getLabelForValue(value as number);
          return `${label}h`;
        }
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
    easing: "easeOutBounce",
  },
};
