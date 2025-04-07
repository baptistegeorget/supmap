import { Router, json } from "express";
import authRouter from "./auth/index.js";
import usersRouter from "./users/index.js";

const router = Router();

router.use(json());
router.use("/v1", authRouter);
router.use("/v1", usersRouter);

export default router;