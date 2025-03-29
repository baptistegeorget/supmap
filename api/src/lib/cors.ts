import { CorsOptions } from "cors";

export const options: CorsOptions = {
  origin: "http://localhost",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};