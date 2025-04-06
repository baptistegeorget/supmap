import { Router } from "express";
import { ZodError } from "zod";
import { User, UserModel } from "../../../../models/user.js";
import { createRouteSchema, idSchema, positiveIntegerSchema } from "../../../../lib/zod.js";
import { RouteModel } from "../../../../models/route.js";
import { getRoute } from "../../../../lib/graphhopper.js";
import { IncidentModel } from "../../../../models/incident.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { userId: string }).userId);
    const limit = req.query.limit && typeof req.query.limit === "string" ? positiveIntegerSchema.parse(req.query.limit) : 10;
    const offset = req.query.offset && typeof req.query.offset === "string" ? positiveIntegerSchema.parse(req.query.offset) : 0;

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const routeModel = new RouteModel();
    const routes = await routeModel.getByUserId(user.id, limit, offset);

    res.status(200).json(routes);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.get("/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { routeId: string, userId: string }).userId);
    const routeId = idSchema.parse(req.params.routeId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const routeModel = new RouteModel();
    const route = await routeModel.getById(routeId);

    if (!route || route.created_by !== userId) {
      res.status(404).json({ message: "Route not found." });
      return;
    }

    res.status(200).json(route);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.post("/", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { userId: string }).userId);
    const { profile, points } = createRouteSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const incidentModel = new IncidentModel();
    const incidents = await incidentModel.getAll(1000000000, 0);

    const routeResponseBody = await getRoute({
      profile,
      points,
      locale: "fr",
      instructions: true,
      algorithm: "alternative_route",
      "alternative_route.max_paths": 3,
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
    });

    const routeModel = new RouteModel();
    const route = await routeModel.create({
      graphhopper_response: routeResponseBody,
      created_by: userId
    });

    res.status(201).json(route);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.patch("/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { routeId: string, userId: string }).userId);
    const routeId = idSchema.parse(req.params.routeId);
    const { profile, points } = createRouteSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const routeModel = new RouteModel();
    let route = await routeModel.getById(routeId);

    if (!route || route.created_by !== userId) {
      res.status(404).json({ message: "Route not found." });
      return;
    }

    const incidentModel = new IncidentModel();
    const incidents = await incidentModel.getAll(1000000000, 0);

    const routeResponseBody = await getRoute({
      profile,
      points,
      locale: "fr",
      instructions: true,
      algorithm: "alternative_route",
      "alternative_route.max_paths": 3,
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
    });

    route = await routeModel.update(route.id, {
      graphhopper_response: routeResponseBody,
      modified_by: userId
    });

    res.status(200).json(route);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.delete("/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { routeId: string, userId: string }).userId);
    const routeId = idSchema.parse(req.params.routeId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const routeModel = new RouteModel();
    const route = await routeModel.getById(routeId);

    if (!route || route.created_by !== userId) {
      res.status(404).json({ message: "Route not found." });
      return;
    }

    await routeModel.delete(route.id);

    res.status(200).json({ message: "Route deleted." });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

export default router;