import express from "express";
import cors from "cors";
import { corsOptions } from "./cors.js";
import v1Router from "../routes/v1/index.js";

export const app = express();

app.use(cors(corsOptions));
app.use(v1Router);