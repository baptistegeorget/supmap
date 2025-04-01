import { Router } from "express";
import { ZodError } from "zod";
import { User, UserModel } from "../../../../models/user.js";
import { createRouteSchema, idSchema, positiveIntegerSchema } from "../../../../lib/zod.js";
import { RouteModel } from "../../../../models/route.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit && typeof req.query.limit === "string" ? positiveIntegerSchema.parse(req.query.limit) : 10;
    const offset = req.query.offset && typeof req.query.offset === "string" ? positiveIntegerSchema.parse(req.query.offset) : 0;
    const userId = idSchema.parse((req.params as { userId: string }).userId);

    const routeModel = new RouteModel();
    const routes = await routeModel.getByUserId(userId, limit, offset);

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

router.get("/:routeId", async (req, res) => { });

router.post("/", async (req, res) => {
  try {
    if (!process.env.GRAPHHOPPER_API_KEY) throw new Error("GraphHopper API key is not set");

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

    const response = await fetch(`https://graphhopper.com/api/1/route?key=${process.env.GRAPHHOPPER_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        profile,
        points,
        locale: "fr",
        instructions: true,
        algorithm: "alternative_route",
        max_paths: 3
      })
    });

    const data = await response.json();

    const routeModel = new RouteModel();
    
    const route = await routeModel.create({
      graphhopper_response: data,
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

router.patch("/:routeId", async (req, res) => { });

router.delete("/:routeId", async (req, res) => { });

export default router;