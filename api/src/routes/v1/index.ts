import { Router, json } from "express";
import authRouter from "./auth/index.js";
import usersRouter from "./users/index.js";
import incidentsRouter from "./incidents/index.js";
import { auth } from "../../middlewares/auth.js";

const router = Router();

router.use(json());
router.use("/v1", authRouter);
router.use("/v1", usersRouter);
router.use("/v1", auth, incidentsRouter);

export default router;