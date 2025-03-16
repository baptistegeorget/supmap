import { Router, json } from "express";
import authRouter from "@routes/v1/auth/index.js";
import usersRouter from "@routes/v1/users/index.js";
import rolesRouter from "@routes/v1/roles/index.js";

const router = Router();

router.use(json());
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/roles", rolesRouter);

export default router;