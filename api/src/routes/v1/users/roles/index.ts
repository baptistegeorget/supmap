import { Router } from "express";
import { ZodError } from "zod";
import { idSchema } from "../../../../lib/zod.js";
import { Role } from "../../../../models/role.js";
import { UserRole } from "../../../../models/user-role.js";
import { User } from "../../../../models/user.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const userId = idSchema.parse((req.params as { userId: string }).userId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const userRoles = await UserRole.findByUserId(userId);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.roleId) as Role.IRole;
    }));

    res.status(200).json(roles);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        message: "Invalid request",
        errors: error.errors 
      });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
    console.error(error);
    return;
  }
});

router.get("/:roleId", async (req, res) => {
  try {
    const userId = idSchema.parse((req.params as { userId: string, roleId: string }).userId);
    const roleId = idSchema.parse(req.params.roleId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    res.status(200).json(role);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        message: "Invalid request",
        errors: error.errors 
      });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
    console.error(error);
    return;
  }
});

router.post("/", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.isAdministrator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const userId = idSchema.parse((req.params as { userId: string }).userId);
    const roleId = idSchema.parse(req.body.roleId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    const userRoles = await UserRole.findByUserId(userId);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.roleId) as Role.IRole;
    }));

    if (roles.some(role => role.id === roleId)) {
      res.status(409).json({ message: "Role already assigned" });
      return;
    }

    await UserRole.create(userId, roleId);

    res.status(201).json({ message: "Role assigned" });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        message: "Invalid request",
        errors: error.errors 
      });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
    console.error(error);
    return;
  }
});

router.delete("/:roleId", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.isAdministrator)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    const userId = idSchema.parse((req.params as { userId: string, roleId: string }).userId);
    const roleId = idSchema.parse(req.params.roleId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    const userRoles = await UserRole.findByUserId(userId);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.roleId) as Role.IRole;
    }));

    if (!roles.some(role => role.id === roleId)) {
      res.status(404).json({ message: "Role not assigned" });
      return;
    }

    await UserRole.remove(userId, roleId);

    res.status(200).json({ message: "Role removed" });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        message: "Invalid request",
        errors: error.errors 
      });
      return;
    }

    res.status(500).json({ message: "Internal server error" });
    console.error(error);
    return;
  }
});

export default router;