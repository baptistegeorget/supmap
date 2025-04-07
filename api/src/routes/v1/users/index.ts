import express from "express";
import { ZodError } from "zod";
import { postUserSchema, idSchema, limitSchema, patchUserSchema, offsetSchema } from "../../../lib/zod.js";
import { decrypt, encrypt, hash, verify } from "../../../lib/crypto.js";
import { auth } from "../../../middlewares/auth.js";
import { UserModel, User } from "../../../models/user.js";
import routesRouter from "./routes/index.js";
import incidentsRouter from "./incidents/index.js";

const router = express.Router();

router.use(auth, routesRouter);
router.use(auth, incidentsRouter)

router.get("/users", auth, async (req, res) => {
  try {
    const limit = limitSchema.parse(req.query.limit)

    const offset = offsetSchema.parse(req.query.offset)

    const userModel = new UserModel();

    let users = await userModel.getAll(limit, offset);

    users = users.map(
      (user) => {
        user.email = decrypt(user.email);
        user.name = decrypt(user.name);
        user.password = null;
        user.picture = user.picture ? decrypt(user.picture) : null;
        return user;
      }
    );

    res.status(200).json(users);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.get("/users/:userId", auth, async (req, res) => {
  try {
    const userId = idSchema.parse(req.params.userId);

    const userModel = new UserModel();

    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

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
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.post("/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      picture
    } = postUserSchema.parse(req.body);

    const userModel = new UserModel();

    let user = await userModel.getByEmail(encrypt(email));

    if (user) {
      res.status(409).json(
        {
          message: "Email already used."
        }
      );

      return;
    }

    user = await userModel.create(
      {
        email: encrypt(email),
        name: encrypt(name),
        password: await hash(password),
        picture: picture ? encrypt(picture) : null
      }
    );

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(201).json(user);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.patch("/users/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    const {
      name,
      email,
      password,
      picture,
      currentPassword
    } = patchUserSchema.parse(req.body);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    let user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    if (email && email !== decrypt(user.email)) {
      const existingUser = await userModel.getByEmail(encrypt(email));

      if (existingUser) {
        res.status(409).json(
          {
            message: "Email already used."
          }
        );

        return;
      }
    }

    if (password) {
      if (!user.password) {
        res.status(400).json(
          {
            message: "You don't have a password to modify. Please reset your password to set a new one."
          }
        );

        return;
      }

      if (!currentPassword) {
        res.status(400).json(
          {
            message: "Current password is required to modified password."
          }
        );

        return;
      }

      if (!(await verify(currentPassword, user.password))) {
        res.status(401).json(
          {
            message: "Invalid current password."
          }
        );

        return;
      }
    }

    user = await userModel.update(
      userId,
      {
        email: email ? encrypt(email) : user.email,
        name: name ? encrypt(name) : user.name,
        password: password ? await hash(password) : user.password,
        picture: picture ? encrypt(picture) : user.picture
      }
    );

    user.email = decrypt(user.email);
    user.name = decrypt(user.name);
    user.password = null;
    user.picture = user.picture ? decrypt(user.picture) : null;

    res.status(200).json(user);

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

router.delete("/users/:userId", auth, async (req, res) => {
  try {
    const authUser = res.locals.authUser as User;

    const userId = idSchema.parse(req.params.userId);

    if (authUser.id !== userId && authUser.role !== "admin") {
      res.status(403).json(
        {
          message: "Access denied."
        }
      );

      return;
    }

    const userModel = new UserModel();

    const user = await userModel.getById(userId);

    if (!user) {
      res.status(404).json(
        {
          message: "User not found."
        }
      );

      return;
    }

    await userModel.delete(userId);

    res.status(200).json(
      {
        message: "User deleted."
      }
    );

    return;
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json(
        {
          message: error.errors.map((error) => error.message).join(" ")
        }
      );

      return;
    }

    res.status(500).json(
      {
        message: "Internal server error."
      }
    );

    console.error(error);

    return;
  }
});

export default router;