import { ChartOptions } from "chart.js";

export const barIncidentsChartData = (incidentCounts: {
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
      label: 'Signalements',
      data: [
        incidentCounts.accidents,
        incidentCounts.trafficJams,
        incidentCounts.roadClosed,
        incidentCounts.policeControl,
        incidentCounts.roadblock,
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
    },
  ],
});

export const barIncidentsChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y', // 🔁 pour un bar horizontal (enlève cette ligne pour vertical)
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Nombre de signalements',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Type d’incident',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};
