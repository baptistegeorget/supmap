import express from "express";
import { router as authRouter } from "../routes/auth.route.js";
import { router as usersRouter } from "../routes/users.route.js";
import { router as rolesRouter } from "../routes/roles.route.js";

export const app = express();

app.use(express.json());
app.use(authRouter);
app.use(usersRouter);
app.use(rolesRouter);