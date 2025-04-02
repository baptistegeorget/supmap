import { Router } from "express";
import { ZodError } from "zod";
import { User, UserModel } from "../../../../models/user.js";
import { idSchema, positiveIntegerSchema, createIncidentSchema, updateIncidentSchema } from "../../../../lib/zod.js";
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

    const incidentModel = new IncidentModel();
    const incidents = await incidentModel.getByUserId(user.id, limit, offset);

    res.status(200).json(incidents);
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

router.get("/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { incidentId: string, userId: string }).userId);
    const incidentId = idSchema.parse(req.params.incidentId);

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

    const incidentModel = new IncidentModel();
    const incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== userId) {
      res.status(404).json({ message: "Incident not found." });
      return;
    }

    res.status(200).json(incident);
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
    const { type, location } = createIncidentSchema.parse(req.body);

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

    const incident = await incidentModel.create({
      type,
      location,
      created_by: user.id,
    });

    res.status(201).json(incident);
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

router.patch("/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { incidentId: string, userId: string }).userId);
    const incidentId = idSchema.parse(req.params.incidentId);
    const { type, location } = updateIncidentSchema.parse(req.body);

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

    const incidentModel = new IncidentModel();
    let incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== userId) {
      res.status(404).json({ message: "Incident not found." });
      return;
    }

    incident = await incidentModel.update(incident.id, {
      type: type || incident.type,
      location: location || incident.location,
      modified_by: user.id
    });

    res.status(200).json(incident);
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

router.delete("/:incidentId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;
    const userId = idSchema.parse((req.params as { incidentId: string, userId: string }).userId);
    const incidentId = idSchema.parse(req.params.incidentId);

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

    const incidentModel = new IncidentModel();
    const incident = await incidentModel.getById(incidentId);

    if (!incident || incident.created_by !== userId) {
      res.status(404).json({ message: "Incident not found." });
      return;
    }

    await incidentModel.delete(incident.id);

    res.status(200).json({ message: "Incident deleted." });
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