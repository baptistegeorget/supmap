import express from "express";
import { ZodError } from "zod";
import { updateRoleSchema, createRoleSchema, idSchema, limitSchema, offsetSchema } from "../../../lib/zod.js";
import { Role } from "../../../models/role.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const limit = limitSchema.safeParse(req.query.limit).success ? parseInt(limitSchema.parse(req.query.limit)) : undefined;
    const offset = offsetSchema.safeParse(req.query.offset).success ? parseInt(offsetSchema.parse(req.query.offset)) : undefined;

    const roles = await Role.findAll(limit, offset);

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
    const roleId = idSchema.parse(req.params.roleId);

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

    if (!authUserRoles.some(role => role.isAdministrator || role.canManageRoles)) {
      res.status(403).send({ message: "You do not have permission to create roles" });
      return;
    }

    const { name, isAdministrator, canManageRoles, canManageUsers, canManageAlerts } = createRoleSchema.parse(req.body);

    if (isAdministrator && !authUserRoles.some(role => role.isAdministrator)) {
      res.status(403).send({ message: "You do not have permission to create an administrator role" });
      return;
    }

    let role = await Role.findByName(name);

    if (role) {
      res.status(400).json({ message: "Role already exists" });
      return;
    }

    role = await Role.create(name, isAdministrator, canManageUsers, canManageRoles, canManageAlerts);

    res.status(201).setHeader("Location", `/v1/roles/${role.id}`).json(role);
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

router.patch("/:roleId", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.isAdministrator || role.canManageRoles)) {
      res.status(403).send({ message: "You do not have permission to update roles" });
      return;
    }

    const { name, isAdministrator, canManageRoles, canManageUsers, canManageAlerts } = updateRoleSchema.parse(req.body);

    if (isAdministrator && !authUserRoles.some(role => role.isAdministrator)) {
      res.status(403).send({ message: "You do not have permission to update role to an administrator role" });
      return;
    }

    const roleId = idSchema.parse(req.params.roleId);

    let role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    if (name && name !== role.name) {
      const existingRole = await Role.findByName(name);

      if (existingRole) {
        res.status(400).json({ message: "Role already exists" });
        return;
      }
    }

    role = await Role.update(
      roleId, 
      name || role.name, 
      isAdministrator || role.isAdministrator, 
      canManageUsers || role.canManageUsers, 
      canManageRoles || role.canManageRoles, 
      canManageAlerts || role.canManageAlerts
    );

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

router.delete("/:roleId", async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.isAdministrator || role.canManageRoles)) {
      res.status(403).send({ message: "You do not have permission to delete roles" });
      return;
    }

    const roleId = idSchema.parse(req.params.roleId);

    const role = await Role.findById(roleId);

    if (!role) {
      res.status(404).json({ message: "Role not found" });
      return;
    }

    if (role.isAdministrator && !authUserRoles.some(role => role.isAdministrator)) {
      res.status(403).send({ message: "You do not have permission to delete an administrator role" });
      return;
    }

    await Role.remove(roleId);

    res.status(200).json({ message: "Role deleted" });
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