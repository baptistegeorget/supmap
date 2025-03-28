import express from "express";
import { ZodError } from "zod";
import { createUserSchema, idSchema, positiveIntegerSchema, updateUserSchema } from "../../../lib/zod.js";
import { decrypt, encrypt, hash } from "../../../lib/crypto.js";
import { auth } from "../../../middlewares/auth.js";
import { UserModel, User } from "../../../models/user.js";
import routesRouter from "./routes/index.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const limit = req.query.limit && typeof req.query.limit === "string" ? positiveIntegerSchema.parse(req.query.limit) : 10;
    const offset = req.query.offset && typeof req.query.offset === "string" ? positiveIntegerSchema.parse(req.query.offset) : 0;

    const userModel = new UserModel();
    let users = await userModel.getAll(limit, offset);

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
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.get("/:userId", auth, async (req, res) => {
  try {
    const userId = idSchema.parse(req.params.userId);

    const userModel = new UserModel();
    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
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
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.post("/", async (req, res) => {
  try {
    const { email, name, password, picture } = createUserSchema.parse(req.body);

    const userModel = new UserModel();
    let user = await userModel.getByEmail(encrypt(email));

    if (user) {
      res.status(409).json({ message: "Email already used." });
      return;
    }

    user = await userModel.create({
      email: encrypt(email),
      name: encrypt(name),
      password: await hash(password),
      picture: picture ? encrypt(picture) : null
    });

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(201).json(user);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.patch("/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.auth.user as User;
    const userId = idSchema.parse(req.params.userId);
    const { email, name, password, picture } = updateUserSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (email && email !== decrypt(user.email)) {
      const existingUser = await userModel.getByEmail(encrypt(email));

      if (existingUser) {
        res.status(409).json({ message: "Email already used." });
        return;
      }
    }

    user = await userModel.update(userId, {
      email: email ? encrypt(email) : user.email,
      name: name ? encrypt(name) : user.name,
      password: password ? await hash(password) : user.password,
      picture: picture ? encrypt(picture) : user.picture
    });

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(200).json(user);
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.delete("/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.auth.user as User;
    const userId = idSchema.parse(req.params.userId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const userModel = new UserModel();
    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    await userModel.delete(userId);

    res.status(200).json({ message: "User deleted." });
    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Invalid request.",
        errors: error.errors
      });
      return;
    }

    res.status(500).json({ message: "Internal server error." });
    console.error(error);
    return;
  }
});

router.use("/:userId/routes", auth, routesRouter);

export default router;