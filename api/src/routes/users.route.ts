import express from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import { createUserSchema, idSchema, limitSchema, offsetSchema, updateUserSchema } from "../lib/zod.js";
import { ZodError } from "zod";
import { decrypt, encrypt, hash } from "../lib/crypto.js";
import { UserRole } from "../models/user-role.model.js";
import { Route } from "../models/route.model.js";

export const router = express.Router();

router.get("/users", auth, async (req, res) => {
  try {
    const limit = req.query.limit ? await limitSchema.parseAsync(req.query.limit) : undefined;
    const offset = req.query.offset ? await offsetSchema.parseAsync(req.query.offset) : undefined;

    const users = await User.findAll(limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);

    const usersResponse = users.map(user => {
      return {
        id: user.id,
        name: decrypt(user.name),
        email: decrypt(user.email),
        ...(user.picture ? { picture: decrypt(user.picture) } : {}),
        createdAt: user.created_at
      };
    });

    res.status(200).json(usersResponse);
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

router.get("/users/:id", auth, async (req, res) => {
  try {
    const id = await idSchema.parseAsync(req.params.id);

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userResponse = {
      id: user.id,
      name: decrypt(user.name),
      email: decrypt(user.email),
      ...(user.picture ? { picture: decrypt(user.picture) } : {}),
      createdAt: user.created_at
    };

    res.status(200).json(userResponse);
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

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, picture } = await createUserSchema.parseAsync(req.body);

    let user = await User.findByEmail(encrypt(email));

    if (user) {
      res.status(409).json({ error: "Email already used" });
      return;
    }

    user = await User.create(encrypt(email), encrypt(name), await hash(password), picture ? encrypt(picture) : undefined);

    let role = await Role.findByName("User");

    if (!role) {
      role = await Role.create("User");
    }

    await UserRole.create(user.id, role.id);

    const userResponse = {
      id: user.id,
      name: decrypt(user.name),
      email: decrypt(user.email),
      ...(user.picture ? { picture: decrypt(user.picture) } : {}),
      createdAt: user.created_at
    };

    res.status(201).setHeader("Location", `/users/${user.id}`).json(userResponse);
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

router.patch("/users/:id", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User.IUser;
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const id = await idSchema.parseAsync(req.params.id);

    if (authUser.id !== id && !authUserRoles.some(role => role.is_administrator || role.can_manage_users)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    let user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, email, password, picture } = await updateUserSchema.parseAsync(req.body);

    if (email && email !== decrypt(user.email)) {
      const existingUser = await User.findByEmail(encrypt(email));

      if (existingUser) {
        res.status(409).json({ error: "Email already used" });
        return;
      }
    }

    user = await User.update(id, email ? encrypt(email) : user.email, name ? encrypt(name) : user.name, password ? await hash(password) : user.password || undefined, picture ? encrypt(picture) : user.picture || undefined);

    const userResponse = {
      id: user.id,
      name: decrypt(user.name),
      email: decrypt(user.email),
      ...(user.picture ? { picture: decrypt(user.picture) } : {}),
      createdAt: user.created_at
    };

    res.status(200).json(userResponse);
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

router.delete("/users/:id", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User.IUser;
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const id = await idSchema.parseAsync(req.params.id);

    if (authUser.id !== id && !authUserRoles.some(role => role.is_administrator || role.can_manage_users)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await User.remove(id);

    res.status(200).json({ message: "User deleted" });
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

router.get("/users/:userId/roles", auth, async (req, res) => {
  try {
    const limit = req.query.limit ? await limitSchema.parseAsync(req.query.limit) : undefined;
    const offset = req.query.offset ? await offsetSchema.parseAsync(req.query.offset) : undefined;

    const userId = await idSchema.parseAsync(req.params.userId);

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

router.get("/users/:userId/roles/:roleId", auth, async (req, res) => {
  try {
    const userId = await idSchema.parseAsync(req.params.userId);
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

router.post("/users/:userId/roles", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.is_administrator)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const userId = await idSchema.parseAsync(req.params.userId);

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

router.delete("/users/:userId/roles/:roleId", auth, async (req, res) => {
  try {
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    if (!authUserRoles.some(role => role.is_administrator)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const userId = await idSchema.parseAsync(req.params.userId);

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

router.get("/users/:userId/routes", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User.IUser;

    const userId = await idSchema.parseAsync(req.params.userId);

    if (authUser.id !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const routes = await Route.findByUserId(userId);

    const routesResponse = routes.map(route => {
      return {
        id: route.id,
        userId: route.user_id,
        startPoint: route.start_point,
        endPoint: route.end_point,
        route: route.route,
        distance: route.distance,
        duration: route.duration,
        createdAt: route.created_at
      };
    });
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

router.get("/users/:userId/routes/:routeId", auth, async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

router.post("/users/:userId/routes", auth, async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

router.delete("/users/:userId/routes/:routeId", auth, async (req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});