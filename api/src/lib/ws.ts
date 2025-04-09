import { WebSocketServer, WebSocket } from "ws";
import { IncidentModel } from "../models/incident.js";
import polyline from "@mapbox/polyline";
import { RouteOptions } from "./graphhopper.js";
import { getRoute } from "./graphhopper.js";

export const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, req) => {
  (ws as WebSocket & { points: Array<[number, number]> }).points = (req as any).points;

  ws.on("message", async (message) => {
    try {
      const currentPoints = (ws as WebSocket & { points: Array<[number, number]> }).points;

      const {
        location,
        profile
      } = JSON.parse(message.toString());

      const incidentModel = new IncidentModel();

      const incidents = await incidentModel.getRecents(1800000, 1000000000, 0);

      const response: any = {};

      if (!isPointOnRoute(location, currentPoints)) {
        const routeOptions: RouteOptions = {
          profile,
          points: [
            location,
            currentPoints[currentPoints.length - 1]
          ],
          locale: "fr",
          instructions: true,
          "ch.disable": true,
          custom_model: {
            speed: incidents.map(incident => {
              switch (incident.type) {
                case "accident":
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "0.8"
                  }
                case "traffic_jam":
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "0.5"
                  }
                case "road_closed":
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "0"
                  }
                case "police_control":
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "0.9"
                  }
                case "roadblock":
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "0.7"
                  }
                default:
                  return {
                    if: "in_" + incident.id,
                    multiply_by: "1"
                  }
              }
            }),
            areas: {
              type: "FeatureCollection",
              features: incidents.map(incident => ({
                type: "Feature",
                id: incident.id,
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [
                        incident.location.coordinates[0] + 0.000135 / Math.cos(incident.location.coordinates[1] * Math.PI / 180),
                        incident.location.coordinates[1] + 0.000135
                      ],
                      [
                        incident.location.coordinates[0] + 0.000135 / Math.cos(incident.location.coordinates[1] * Math.PI / 180),
                        incident.location.coordinates[1] - 0.000135
                      ],
                      [
                        incident.location.coordinates[0] - 0.000135 / Math.cos(incident.location.coordinates[1] * Math.PI / 180),
                        incident.location.coordinates[1] - 0.000135
                      ],
                      [
                        incident.location.coordinates[0] - 0.000135 / Math.cos(incident.location.coordinates[1] * Math.PI / 180),
                        incident.location.coordinates[1] + 0.000135
                      ],
                      [
                        incident.location.coordinates[0] + 0.000135 / Math.cos(incident.location.coordinates[1] * Math.PI / 180),
                        incident.location.coordinates[1] + 0.000135
                      ]
                    ]
                  ]
                }
              }))
            }
          }
        };

        const graphHopperResponse = await getRoute(routeOptions);

        (ws as WebSocket & { points: Array<[number, number]> }).points = polyline.decode(graphHopperResponse.body.paths[0].points as string).map((point: number[]) => [point[1], point[0]]);

        response.graphhopper_response = graphHopperResponse;
      }

      const nearIncidents = await incidentModel.getByLocation(
        {
          type: "Point",
          coordinates: location
        },
        500,
        1000000000
      );

      response.nearIncidents = nearIncidents;

      ws.send(JSON.stringify(response));

      return;
    } catch (error) {
      console.error(error);

      return;
    }
  });
});

function isPointOnRoute(
  point: [number, number],
  routePoints: Array<[number, number]>,
  thresholdInMeters: number = 10
): boolean {
  const R = 6371000;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const pointToSegmentDistance = (
    point: [number, number],
    segmentStart: [number, number],
    segmentEnd: [number, number]
  ): number => {
    const [px, py] = point;
    const [sx, sy] = segmentStart;
    const [ex, ey] = segmentEnd;

    const segmentLengthSquared =
      Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2);

    if (segmentLengthSquared === 0) {
      return haversineDistance(point, segmentStart);
    }

    let t =
      ((px - sx) * (ex - sx) + (py - sy) * (ey - sy)) /
      segmentLengthSquared;

    t = Math.max(0, Math.min(1, t));

    const projectionX = sx + t * (ex - sx);
    const projectionY = sy + t * (ey - sy);

    return haversineDistance(point, [projectionX, projectionY]);
  };

  const haversineDistance = (
    [lon1, lat1]: [number, number],
    [lon2, lat2]: [number, number]
  ): number => {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  return routePoints.some((start, index) => {
    if (index === routePoints.length - 1) {
      return false;
    }

    const end = routePoints[index + 1];
    const distance = pointToSegmentDistance(point, start, end);

    return distance < thresholdInMeters;
  });
}