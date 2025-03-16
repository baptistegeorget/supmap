import express from "express";
import swaggerUIExpress from "swagger-ui-express";
import swaggerDocumentation from "../../swagger.json" with { type: "json" };
import v1Router from "../routes/v1/index.js";

export const app = express();

app.use("/documentation", swaggerUIExpress.serve, swaggerUIExpress.setup(swaggerDocumentation));
app.use("/v1", v1Router);