import express from "express";
import v1Router from "../routes/v1/index.js";

export const app = express();

app.use("/v1", v1Router);