import { Router } from "express";
import { idSchema, limitSchema, offsetSchema } from "../../../lib/zod.js";
import { IncidentModel } from "../../../models/incident.js";
import { ZodError } from "zod";
import votesRouter from "./votes/index.js";

const router = Router();

router.get("/incidents", async (req, res) => {
  try {
    const limit = limitSchema.parse(req.query.limit);

    const offset = offsetSchema.parse(req.query.offset);

    const incidentModel = new IncidentModel();

    const incidents = await incidentModel.getAll(limit, offset);

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

router.get("/incidents/:incidentId", async (req, res) => {
  try {
    const incidentId = idSchema.parse(req.params.incidentId);

    const incidentModel = new IncidentModel();

    const incident = await incidentModel.getById(incidentId);

    if (!incident) {
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

router.use(votesRouter);

export default router;