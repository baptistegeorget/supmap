import { Router } from "express";
import { ZodError } from "zod";
import { User, UserModel } from "../../../../models/user.js";
import { postRouteSchema, idSchema, limitSchema, offsetSchema, patchRouteSchema } from "../../../../lib/zod.js";
import { RouteModel } from "../../../../models/route.js";
import { getRoute, RouteOptions } from "../../../../lib/graphhopper.js";
import { IncidentModel } from "../../../../models/incident.js";

const router = Router();

router.get("/users/:userId/routes", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const limit = limitSchema.parse(req.query.limit);

    const offset = offsetSchema.parse(req.query.offset);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    const routeModel = new RouteModel();

    const routes = await routeModel.getByUserId(user.id, limit, offset);

    res.status(200).json(routes);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.get("/users/:userId/routes/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const routeId = idSchema.parse(req.params.routeId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );
      return;
    }

    const routeModel = new RouteModel();

    const route = await routeModel.getById(routeId);

    if (!route || route.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Route not found."
        }
      );

      return;
    }

    res.status(200).json(route);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.post("/users/:userId/routes", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const {
      profile,
      points
    } = postRouteSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    const incidentModel = new IncidentModel();

    const incidents = await incidentModel.getAll(1000000000, 0);

    const routeOptions: RouteOptions = {
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
    };

    const routeResponse = await getRoute(routeOptions);

    const routeModel = new RouteModel();

    const route = await routeModel.create(
      {
        graphhopper_response: routeResponse.body,
        created_by: authUser.id
      }
    );

    res.status(201).json(route);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.patch("/users/:userId/routes/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const routeId = idSchema.parse(req.params.routeId);

    const {
      profile,
      points
    } = patchRouteSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    const routeModel = new RouteModel();

    let route = await routeModel.getById(routeId);

    if (!route || route.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Route not found."
        }
      );

      return;
    }

    const incidentModel = new IncidentModel();

    const incidents = await incidentModel.getAll(1000000000, 0);

    const routeOptions: RouteOptions = {
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
    };

    const routeResponse = await getRoute(routeOptions);

    route = await routeModel.update(
      route.id,
      {
        graphhopper_response: routeResponse.body,
        modified_by: authUser.id
      }
    );

    res.status(200).json(route);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.delete("/users/:userId/routes/:routeId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const routeId = idSchema.parse(req.params.routeId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    const routeModel = new RouteModel();

    const route = await routeModel.getById(routeId);

    if (!route || route.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Route not found."
        }
      );

      return;
    }

    await routeModel.delete(route.id);

    res.status(200).json(
      {
        message: "Route deleted."
      }
    );

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

export default router;