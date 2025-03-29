import express from "express";
import v1Router from "../routes/v1/index.js";
import cors from "cors"
import { options as corsOptions } from "./cors.js";

export const app = express();

app.use(cors(corsOptions));
app.use("/v1", v1Router);