import { Router } from "express";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {});

router.get("/:routeId", async (req, res) => {});

router.post("/", async (req, res) => {});

router.patch("/:routeId", async (req, res) => {});

router.delete("/:routeId", async (req, res) => {});

export default router;