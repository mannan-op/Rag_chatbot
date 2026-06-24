import { Router } from "express";
import {
  checkoutSession,
  customerPortal,
} from "../controllers/stripeController.js";

const router = Router();

router.get("/", (_request, response) => {
  response.status(200).json({
    message: "Authenticated Stripe routes are available.",
  });
});

router.post("/create-checkout-session", checkoutSession);
router.post("/customer-portal", customerPortal);

export default router;
