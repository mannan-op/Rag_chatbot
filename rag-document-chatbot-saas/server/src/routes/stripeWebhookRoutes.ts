import express, { Router } from "express";
import { stripeWebhook } from "../controllers/stripeController.js";

const router = Router();

router.post("/", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
