import http from "http";
import { app } from "./express.js";
import { wss } from "./ws.js";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.js";
import { idSchema, pathIndexSchema } from "./zod.js";
import { RouteModel } from "../models/route.js";
import polyline from "@mapbox/polyline";

if (!process.env.JWT_SECRET) throw new Error("Missing environment variable: JWT_SECRET");

const JWT_SECRET = process.env.JWT_SECRET;

export const server = http.createServer(app);

server.on("upgrade", async (req, socket, head) => {
  if (req.url && /^\/v1\/users\/[1-9]\d{0,18}\/routes\/[0-9]\d{0,18}\/navigate\?pathIndex=[0-2]$/.test(req.url)) {
    try {
      const authorization = req.headers["authorization"];

      if (!authorization) {
        socket.destroy();

        return;
      }

      if (!authorization.startsWith("Bearer ")) {
        socket.destroy();

        return;
      }

      const payload = jwt.verify(authorization.slice(7), JWT_SECRET);

      if (typeof payload === "string" || !payload.id || typeof payload.id !== "string") {
        socket.destroy();

        return;
      }

      const userModel = new UserModel();

      const authUser = await userModel.getById(payload.id);

      if (!authUser) {
        socket.destroy();

        return;
      }

      const userId = idSchema.parse(req.url.split("/")[3]);

      const routeId = idSchema.parse(req.url.split("/")[5]);
      
      const pathIndex = pathIndexSchema.parse(req.url.split("=")[1]);
      
      if (authUser.id !== userId && authUser.role !== "admin") {
        socket.destroy();

        return;
      }

      const user = await userModel.getById(userId);

      if (!user) {
        socket.destroy();

        return;
      }

      const routeModel = new RouteModel();

      const route = await routeModel.getById(routeId);

      if (!route || route.created_by !== user.id) {
        socket.destroy();

        return;
      }

      if (route.graphhopper_response.paths.length - 1 < pathIndex) {
        socket.destroy();

        return;
      }

      (req as any).points = polyline.decode(route.graphhopper_response.paths[pathIndex].points as string).map((point) => [point[1], point[0]]);

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });

      return;
    } catch (error) {
      socket.destroy();

      console.error(error);

      return;
    }
  }

  socket.destroy();

  return;
});