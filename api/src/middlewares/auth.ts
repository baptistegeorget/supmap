import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.js";

if (!process.env.JWT_SECRET) throw new Error("Missing environment variable: JWT_SECRET");

const JWT_SECRET = process.env.JWT_SECRET;

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.header("Authorization");

    if (!authorization) {
      res.status(401).send(
        {
          message: "Missing authorization token."
        }
      );

      return;
    }

    if (!authorization.startsWith("Bearer ")) {
      res.status(401).send(
        {
          message: "Invalid authorization token."
        }
      );

      return;
    }

    const payload = jwt.verify(authorization.slice(7), JWT_SECRET);

    if (typeof payload === "string" || !payload.id || typeof payload.id !== "string") {
      res.status(401).send(
        {
          message: "Invalid authorization token."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(payload.id);

    if (!user) {
      res.status(401).send(
        {
          message: "Invalid authorization token."
        }
      );

      return;
    }

    res.locals.authUser = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).send(
        {
          message: "Invalid authorization token."
        }
      );

      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).send(
        {
          message: "Authorization token expired."
        }
      );

      return;
    }

    if (error instanceof jwt.NotBeforeError) {
      res.status(401).send(
        {
          message: "Authorization token not active."
        }
      );

      return;
    }

    res.status(500).send(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
}