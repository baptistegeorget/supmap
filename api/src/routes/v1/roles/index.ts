import express from "express";
import { ZodError } from "zod";
import { updateRoleSchema, createRoleSchema, idSchema, limitSchema, offsetSchema } from "@lib/zod.js";
import { auth } from "@middlewares/auth.js";
import { Role } from "@models/role.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
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

router.get("/:roleId", auth, async (req, res) => {
  try {
    const roleId = await idSchema.parseAsync(req.params.roleId);

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

router.post("/", auth, async (req, res) => {
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

router.patch("/:roleId", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const roleId = await idSchema.parseAsync(req.params.roleId);

    if (!authUserRoles.some(role => role.is_administrator || role.can_manage_roles)) {
      res.status(403).send({ error: "You do not have permission to update roles" });
      return;
    }

    let role = await Role.findById(roleId);

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

    role = await Role.update(roleId, name || role.name, isAdministrator, canManageUsers, canManageRoles, canManageAlerts);

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

router.delete("/:roleId", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const roleId = await idSchema.parseAsync(req.params.roleId);

    if (!authUserRoles.some(role => role.is_administrator || role.can_manage_roles)) {
      res.status(403).send({ error: "You do not have permission to delete roles" });
      return;
    }

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    await Role.remove(roleId);

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

export default router;