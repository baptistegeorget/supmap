import { Router, json } from "express";
import authRouter from "./auth/index.js";
import usersRouter from "./users/index.js";

const router = Router();

router.use(json());
router.use("/auth", authRouter);
router.use("/users", usersRouter);

export default router;