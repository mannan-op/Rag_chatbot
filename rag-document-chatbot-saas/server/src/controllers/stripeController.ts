import type { Request, Response } from "express";
import {
  constructStripeEvent,
  createCheckoutSession,
  createCustomerPortalSession,
  handleStripeEvent,
  StripeServiceError,
} from "../services/stripeService.js";
import { checkoutRequestSchema } from "../utils/stripeValidation.js";

function handleStripeError(error: unknown, response: Response) {
  if (error instanceof StripeServiceError) {
    response.status(error.statusCode).json({
      error: "Billing request failed",
      message: error.message,
    });
    return;
  }

  console.error("Unexpected Stripe error.", error);
  response.status(500).json({
    error: "Billing request failed",
    message: "The billing request could not be completed.",
  });
}

export async function checkoutSession(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ error: "Unauthorized", message: "Authentication is required." });
    return;
  }

  const parsed = checkoutRequestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid request",
      message: "Choose either the pro or team plan.",
    });
    return;
  }

  try {
    const url = await createCheckoutSession(
      request.user.id,
      request.user.email,
      parsed.data.plan,
    );
    response.status(200).json({ url });
  } catch (error) {
    handleStripeError(error, response);
  }
}

export async function customerPortal(request: Request, response: Response) {
  if (!request.user) {
    response.status(401).json({ error: "Unauthorized", message: "Authentication is required." });
    return;
  }

  try {
    const url = await createCustomerPortalSession(request.user.id);
    response.status(200).json({ url });
  } catch (error) {
    handleStripeError(error, response);
  }
}

export async function stripeWebhook(request: Request, response: Response) {
  const signature = request.header("stripe-signature");

  if (!signature || !Buffer.isBuffer(request.body)) {
    response.status(400).json({
      error: "Invalid webhook",
      message: "A Stripe signature and raw request body are required.",
    });
    return;
  }

  try {
    const event = constructStripeEvent(request.body, signature);
    await handleStripeEvent(event);
    response.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof StripeServiceError && error.statusCode === 503) {
      response.status(503).json({ error: "Webhook unavailable", message: error.message });
      return;
    }

    console.error("Stripe webhook verification or processing failed.", error);
    response.status(400).json({
      error: "Invalid webhook",
      message: "The Stripe webhook could not be verified.",
    });
  }
}
