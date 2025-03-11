import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { Role } from "../models/role.model.js";
import { updateRoleSchema, createRoleSchema, idSchema, limitSchema, offsetSchema } from "../lib/zod.js";
import { ZodError } from "zod";

export const router = express.Router();

router.get("/roles", auth, async (req, res) => {
  try {
    const limit = req.query.limit ? await limitSchema.parseAsync(req.query.limit) : undefined;
    const offset = req.query.offset ? await offsetSchema.parseAsync(req.query.offset) : undefined;

    const roles = await Role.findAll(limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);

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

router.get("/roles/:id", auth, async (req, res) => {
  try {
    const id = await idSchema.parseAsync(req.params.id);

    const role = await Role.findById(id);

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

router.post("/roles", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.is_administrator || role.can_manage_roles)) {
      res.status(403).send({ error: "You do not have permission to create roles" });
      return;
    }

    const { name, isAdministrator, canManageRoles, canManageUsers, canManageAlerts } = await createRoleSchema.parseAsync(req.body);

    const existingRole = await Role.findByName(name);

    if (existingRole) {
      res.status(400).json({ error: "Role already exists" });
      return;
    }

    if (isAdministrator && !authUserRoles.some(role => role.is_administrator)) {
      res.status(403).send({ error: "You do not have permission to create an administrator role" });
      return;
    }

    const role = await Role.create(name, isAdministrator, canManageUsers, canManageRoles, canManageAlerts);

    const roleResponse = {
      id: role.id,
      name: role.name,
      isAdministrator: role.is_administrator,
      canManageUsers: role.can_manage_users,
      canManageRoles: role.can_manage_roles,
      canManageAlerts: role.can_manage_alerts
    };

    res.status(201).setHeader("Location", `/roles/${role.id}`).json(roleResponse);
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

router.patch("/roles/:id", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const id = await idSchema.parseAsync(req.params.id);

    if (!authUserRoles.some(role => role.is_administrator || role.can_manage_roles)) {
      res.status(403).send({ error: "You do not have permission to update roles" });
      return;
    }

    let role = await Role.findById(id);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    const { name, isAdministrator, canManageRoles, canManageUsers, canManageAlerts } = await updateRoleSchema.parseAsync(req.body);

    if (name && name !== role.name) {
      const existingRole = await Role.findByName(name);

      if (existingRole) {
        res.status(400).json({ error: "Role already exists" });
        return;
      }
    }

    role = await Role.update(id, name || role.name, isAdministrator, canManageUsers, canManageRoles, canManageAlerts);

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

router.delete("/roles/:id", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const id = await idSchema.parseAsync(req.params.id);

    if (!authUserRoles.some(role => role.is_administrator || role.can_manage_roles)) {
      res.status(403).send({ error: "You do not have permission to delete roles" });
      return;
    }

    const role = await Role.findById(id);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    await Role.remove(id);

    res.status(200).json({ message: "Role deleted" });
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