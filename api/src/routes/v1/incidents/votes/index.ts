import { Router } from "express";
import { ZodError } from "zod";
import { idSchema, limitSchema, offsetSchema, patchIncidentVoteSchema, postIncidentVoteSchema } from "../../../../lib/zod.js";
import { IncidentModel } from "../../../../models/incident.js";
import { IncidentVoteModel } from "../../../../models/incident-vote.js";
import { User } from "../../../../models/user.js";

const router = Router();

router.get("/incidents/:incidentId/votes", async (req, res) => {
  try {
    const limit = limitSchema.parse(req.query.limit);

    const offset = offsetSchema.parse(req.query.offset);

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

    const incidentVoteModel = new IncidentVoteModel

    const incidentVotes = await incidentVoteModel.getByIncidentId(incident.id, limit, offset);

    res.status(200).json(incidentVotes);

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

router.get("/incidents/:incidentId/votes/:voteId", async (req, res) => {
  try {
    const incidentId = idSchema.parse(req.params.incidentId);

    const voteId = idSchema.parse(req.params.voteId);

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

    const incidentVoteModel = new IncidentVoteModel();

    const incidentVote = await incidentVoteModel.getById(voteId);

    if (!incidentVote || incidentVote.incident_id !== incident.id) {
      res.status(404).json(
        {
          message: "Vote not found."
        }
      );

      return;
    }

    res.status(200).json(incidentVote);

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

router.post("/incidents/:incidentId/votes", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const incidentId = idSchema.parse(req.params.incidentId);

    const {
      value
    } = postIncidentVoteSchema.parse(req.body);

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

    const incidentVoteModel = new IncidentVoteModel();

    const incidentVotes = await incidentVoteModel.getByIncidentId(incident.id);

    if (incidentVotes.some((incidentVote) => incidentVote.created_by === authUser.id)) {
      res.status(409).json(
        {
          message: "User has already voted."
        }
      );

      return;
    }

    const incidentVote = await incidentVoteModel.create(
      {
        value,
        incident_id: incident.id,
        created_by: authUser.id
      }
    );

    res.status(201).json(incidentVote);

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

router.patch("/incidents/:incidentId/votes/:voteId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const incidentId = idSchema.parse(req.params.incidentId);

    const voteId = idSchema.parse(req.params.voteId);

    const {
      value
    } = patchIncidentVoteSchema.parse(req.body);

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

    const incidentVoteModel = new IncidentVoteModel();

    let incidentVote = await incidentVoteModel.getById(voteId);

    if (!incidentVote || incidentVote.incident_id !== incident.id) {
      res.status(404).json(
        {
          message: "Vote not found."
        }
      );

      return;
    }

    if (incidentVote.created_by !== authUser.id || authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    incidentVote = await incidentVoteModel.update(
      voteId,
      {
        value: value || incidentVote.value,
        incident_id: incidentVote.incident_id,
        modified_by: authUser.id
      }
    );

    res.status(200).json(incidentVote);

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

router.delete("/incidents/:incidentId/votes/:voteId", async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const incidentId = idSchema.parse(req.params.incidentId);

    const voteId = idSchema.parse(req.params.voteId);

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

    const incidentVoteModel = new IncidentVoteModel();

    const incidentVote = await incidentVoteModel.getById(voteId);

    if (!incidentVote || incidentVote.incident_id !== incident.id) {
      res.status(404).json(
        {
          message: "Vote not found."
        }
      );

      return;
    }

    if (incidentVote.created_by !== authUser.id || authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    await incidentVoteModel.delete(voteId);

    res.status(204).send(
      {
        message: "Vote deleted."
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