import { Router } from "express";

const router = Router();

router.get("/", async (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

router.get("/:routeId", async (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

router.post("/", async (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

router.delete("/:routeId", async (_req, res) => {
  res.status(501).json({ error: "Not implemented" });
  return;
});

export default router;