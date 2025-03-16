import express from "express";
import { ZodError } from "zod";
import { createUserSchema, idSchema, limitSchema, offsetSchema, updateUserSchema } from "../../../lib/zod.js";
import { decrypt, encrypt, hash } from "../../../lib/crypto.js";
import { auth } from "../../../middlewares/auth.js";
import { User } from "../../../models/user.js";
import { Role } from "../../../models/role.js";
import { UserRole } from "../../../models/user-role.js";
import rolesRouter from "./roles/index.js";
import routesRouter from "./routes/index.js";

const router = express.Router();

router.use("/:userId/roles", auth, rolesRouter);
router.use("/:userId/routes", auth, routesRouter);

router.get("/", auth, async (req, res) => {
  try {
    const limit = limitSchema.safeParse(req.query.limit).success ? parseInt(limitSchema.parse(req.query.limit)) : undefined;
    const offset = offsetSchema.safeParse(req.query.offset).success ? parseInt(offsetSchema.parse(req.query.offset)) : undefined;

    let users = await User.findAll(limit, offset);

    users = users.map(user => {
      user.email = decrypt(user.email);
      user.name = decrypt(user.name);
      user.password = null;
      user.picture = user.picture ? decrypt(user.picture) : null;
      return user;
    });

    res.status(200).json(users);
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
    const userId = idSchema.parse(req.params.userId);

    let user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(200).json(user);
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
    if (!process.env.DEFAULT_ROLE) throw new Error("DEFAULT_ROLE is not set");

    const { name, email, password, picture } = createUserSchema.parse(req.body);

    let user = await User.findByEmail(encrypt(email));

    if (user) {
      res.status(409).json({ error: "Email already used" });
      return;
    }

    user = await User.create(
      encrypt(email), 
      encrypt(name), 
      await hash(password), 
      picture ? encrypt(picture) : undefined
    );

    let role = await Role.findByName(process.env.DEFAULT_ROLE);

    if (!role) {
      role = await Role.create(process.env.DEFAULT_ROLE);
    }

    await UserRole.create(user.id, role.id);

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(201).setHeader("Location", `/v1/users/${user.id}`).json(user);
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

    const userId = idSchema.parse(req.params.userId);
    const { name, email, password, picture } = updateUserSchema.parse(req.body);

    if (authUser.id !== userId && !authUserRoles.some(role => role.isAdministrator || role.canManageUsers)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    
    let user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (email && email !== decrypt(user.email)) {
      const existingUser = await User.findByEmail(encrypt(email));

      if (existingUser) {
        res.status(409).json({ error: "Email already used" });
        return;
      }
    }

    user = await User.update(
      userId, 
      email ? encrypt(email) : user.email, 
      name ? encrypt(name) : user.name, 
      password ? await hash(password) : user.password, 
      picture ? encrypt(picture) : user.picture
    );

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(200).json(user);
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

    const userId = idSchema.parse(req.params.userId);

    if (authUser.id !== userId && !authUserRoles.some(role => role.isAdministrator || role.canManageUsers)) {
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