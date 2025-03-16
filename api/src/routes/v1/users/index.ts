import express from "express";
import { ZodError } from "zod";
import { createUserSchema, idSchema, limitSchema, offsetSchema, updateUserSchema } from "@lib/zod.js";
import { decrypt, encrypt, hash } from "@lib/crypto.js";
import { auth } from "@middlewares/auth.js";
import { User } from "@models/user.js";
import { Role } from "@models/role.js";
import { UserRole } from "@models/user-role.js";
import rolesRouter from "@routes/v1/users/roles/index.js";
import routesRouter from "@routes/v1/users/routes/index.js";

const router = express.Router();

router.use("/:userId/roles", auth, rolesRouter);
router.use("/:userId/routes", auth, routesRouter);

router.get("/", auth, async (req, res) => {
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

router.get("/:userId", auth, async (req, res) => {
  try {
    const userId = await idSchema.parseAsync(req.params.userId);

    const user = await User.findById(userId);

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

router.post("/", async (req, res) => {
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

router.patch("/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User.IUser;
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const userId = await idSchema.parseAsync(req.params.userId);

    if (authUser.id !== userId && !authUserRoles.some(role => role.is_administrator || role.can_manage_users)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    let user = await User.findById(userId);

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

    user = await User.update(userId, email ? encrypt(email) : user.email, name ? encrypt(name) : user.name, password ? await hash(password) : user.password || undefined, picture ? encrypt(picture) : user.picture || undefined);

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

router.delete("/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User.IUser;
    const authUserRoles = res.locals.authUserRoles as Role.IRole[];

    const userId = await idSchema.parseAsync(req.params.userId);

    if (authUser.id !== userId && !authUserRoles.some(role => role.is_administrator || role.can_manage_users)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await User.remove(userId);

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

export default router;