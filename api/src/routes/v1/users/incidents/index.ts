import { Router } from "express";
import { ZodError } from "zod";
import { User, UserModel } from "../../../../models/user.js";
import { idSchema, limitSchema, postIncidentSchema, patchIncidentSchema, offsetSchema } from "../../../../lib/zod.js";
import { IncidentModel } from "../../../../models/incident.js";

const router = Router();

router.get("/users/:userId/incidents", async (req, res) => {
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

    const incidentModel = new IncidentModel();

    const incidents = await incidentModel.getByUserId(user.id, limit, offset);

    res.status(200).json(incidents);

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

router.get("/users/:userId/incidents/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const incidentId = idSchema.parse(req.params.incidentId);

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

    const incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Incident not found."
        }
      );

      return;
    }

    res.status(200).json(incident);

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

router.post("/users/:userId/incidents", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const {
      type,
      location
    } = postIncidentSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    const incidentModel = new IncidentModel();

    const incident = await incidentModel.create(
      {
        type,
        location: {
          type: "Point",
          coordinates: location
        },
        created_by: authUser.id,
      }
    );

    res.status(201).json(incident);

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

router.patch("/users/:userId/incidents/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const incidentId = idSchema.parse(req.params.incidentId);

    const {
      type,
      location
    } = patchIncidentSchema.parse(req.body);

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

    let incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Incident not found."
        }
      );

      return;
    }

    incident = await incidentModel.update(
      incident.id,
      {
        type: type || incident.type,
        location: {
          type: "Point",
          coordinates: location || incident.location.coordinates
        },
        modified_by: authUser.id
      }
    );

    res.status(200).json(incident);

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

router.delete("/users/:userId/incidents/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const incidentId = idSchema.parse(req.params.incidentId);

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

    const incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== user.id) {
      res.status(404).json(
        {
          message: "Incident not found."
        }
      );

      return;
    }

    await incidentModel.delete(incident.id);

    res.status(200).json(
      {
        message: "Incident deleted."
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