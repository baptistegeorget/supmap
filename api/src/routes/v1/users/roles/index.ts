import { Router } from "express";
import { ZodError } from "zod";
import { idSchema, limitSchema, offsetSchema } from "@lib/zod.js";
import { Role } from "@models/role.js";
import { UserRole } from "@models/user-role.js";
import { User } from "@models/user.js";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  try {
    const limit = req.query.limit ? await limitSchema.parseAsync(req.query.limit) : undefined;
    const offset = req.query.offset ? await offsetSchema.parseAsync(req.query.offset) : undefined;

    const userId = await idSchema.parseAsync((req.params as { userId: string }).userId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userRoles = await UserRole.findByUserId(userId, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.role_id) as Role.IRole;
    }));

    const rolesResponse = roles.map(role => {
      return {
        id: role.id,
        name: role.name,
        isAdministrator: role.is_administrator,
        canManageUsers: role.can_manage_users,
        canManageRoles: role.can_manage_roles,
        canManageAlerts: role.can_manage_alerts
      };
    });

    res.status(200).json(rolesResponse);
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

router.get("/:roleId", async (req, res) => {
  try {
    const userId = await idSchema.parseAsync((req.params as { userId: string, roleId: string }).userId);
    const roleId = await idSchema.parseAsync(req.params.roleId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    const roleResponse = {
      id: role.id,
      name: role.name,
      isAdministrator: role.is_administrator,
      canManageUsers: role.can_manage_users,
      canManageRoles: role.can_manage_roles,
      canManageAlerts: role.can_manage_alerts
    };

    res.status(200).json(roleResponse);
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

router.post("/", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.is_administrator)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const userId = await idSchema.parseAsync((req.params as { userId: string }).userId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const roleId = await idSchema.parseAsync(req.body.roleId);

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    const userRoles = await UserRole.findByUserId(userId);

    const roles = await Promise.all(userRoles.map(async (userRole) => {
      return await Role.findById(userRole.role_id) as Role.IRole;
    }));

    if (roles.some(r => r.id === roleId)) {
      res.status(409).json({ error: "Role already assigned" });
      return;
    }

    await UserRole.create(userId, roleId);

    const roleResponse = {
      id: role.id,
      name: role.name,
      isAdministrator: role.is_administrator,
      canManageUsers: role.can_manage_users,
      canManageRoles: role.can_manage_roles,
      canManageAlerts: role.can_manage_alerts
    };

    res.status(201).setHeader("Location", `/users/${user.id}/roles/${role.id}`).json(roleResponse);
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

router.delete("/:roleId", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.is_administrator)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const userId = await idSchema.parseAsync((req.params as { userId: string, roleId: string }).userId);

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const roleId = await idSchema.parseAsync(req.params.roleId);

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    await UserRole.remove(userId, roleId);

    res.status(200).json({ message: "Role removed" });
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