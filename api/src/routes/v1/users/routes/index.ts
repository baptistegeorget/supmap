import { Router } from "express";
import polyline from "@mapbox/polyline";
import { createRouteSchema, idSchema } from "../../../../lib/zod.js";
import { Route } from "../../../../models/route.js";
import { User } from "../../../../models/user.js";
import { ZodError } from "zod";

const router = Router({ mergeParams: true });

router.post("/", async (req, res) => {
  try {
    if (!process.env.ROUTING_ENGINE_URL) throw new Error("ROUTING_ENGINE_URL is not set");

    const authUser = res.locals.authUser as User.IUser;

    const userId = idSchema.parse((req.params as { userId: string }).userId);
    const { start, end } = createRouteSchema.parse(req.body);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (authUser.id !== user.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const response = await fetch(`${process.env.ROUTING_ENGINE_URL}/route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        locations: [
          { lat: start.latitude, lon: start.longitude },
          { lat: end.latitude, lon: end.longitude }
        ],
        costing: "auto",
        directions_options: { units: "kilometers", "language": "fr-FR" }
      })
    });

    const body = await response.json();

    const route = await Route.create(
      user.id,
      [body.trip.locations[0].lat, body.trip.locations[0].lon],
      [body.trip.locations[body.trip.locations.length - 1].lat, body.trip.locations[body.trip.locations.length - 1].lon],
      polyline.decode(body.trip.legs[0].shape, 6),
      body.trip.summary.length,
      body.trip.summary.time
    );

    res.status(201).json(route);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.errors });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
    console.error(error);
    return;
  }
});

export default router;