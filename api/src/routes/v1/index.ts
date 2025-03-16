import { Router, json } from "express";
import authRouter from "./auth/index.js";
import usersRouter from "./users/index.js";
import rolesRouter from "./roles/index.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.use(json());
router.use("/auth", authRouter);
router.use("/roles", auth, rolesRouter);
router.use("/users", usersRouter);

export default router;