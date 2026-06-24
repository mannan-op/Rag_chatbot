import { Router } from "express";
import {
  developmentSignup,
  getCurrentUser,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/dev-signup", developmentSignup);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
