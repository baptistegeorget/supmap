import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Role } from "../models/role.js";
import { UserRole } from "../models/user-role.js";

export async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }

    const token = req.header("Authorization");

    if (!token) {
      res.status(401).send({ error: "Access Denied" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === "string" || !decoded.id || typeof decoded.id !== "string") {
      res.status(400).send({ error: "Invalid Token" });
      return;
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(400).send({ error: "User not found" });
      return;
    }

    res.locals.authUser = user;

    const userRoles = await UserRole.findByUserId(user.id);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.roleId) as Role.IRole;
    }));

    res.locals.authUserRoles = roles;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(400).send({ error: "Invalid Token" });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(400).send({ error: "Token Expired" });
      return;
    }

    if (error instanceof jwt.NotBeforeError) {
      res.status(400).send({ error: "Token not active" });
      return;
    }

    res.status(500).send({ error: "Internal Server Error" });
    console.error(error);
    return;
  }
}