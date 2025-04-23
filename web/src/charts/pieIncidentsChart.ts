import { ChartOptions } from "chart.js";

export const pieIncidentsChartData = (incidentCounts: {
  accidents: number;
  trafficJams: number;
  roadClosed: number;
  policeControl: number;
  roadblock: number;
}) => ({
  labels: [
    'Accidents',
    'Embouteillages',
    'Routes fermées',
    'Contrôles de police',
    'Barrages',
  ],
  datasets: [
    {
      data: [
        incidentCounts.accidents,
        incidentCounts.trafficJams,
        incidentCounts.roadClosed,
        incidentCounts.policeControl,
        incidentCounts.roadblock,
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
      ],
      borderWidth: 1,
    },
  ],
});

export const pieIncidentsChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
};
