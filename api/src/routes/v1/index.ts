import { Router, json } from "express";
import authRouter from "./auth/index.js";
import usersRouter from "./users/index.js";

const router = Router();

router.use(json());
router.use(authRouter);
router.use(usersRouter);

export default router;