import { CorsOptions } from "cors";

export const options: CorsOptions = {
  origin: [
    "http://localhost",
    "http://web",
    "http://web:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};