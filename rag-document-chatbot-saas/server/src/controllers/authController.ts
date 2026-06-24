import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { supabaseAdmin } from "../config/supabase.js";

const developmentSignupSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
});

export async function developmentSignup(request: Request, response: Response) {
  if (env.nodeEnv !== "development" || !env.devAutoConfirmEmail) {
    response.status(404).json({
      error: "Not found",
      message: "Development signup is disabled.",
    });
    return;
  }

  if (!supabaseAdmin) {
    response.status(503).json({
      error: "Authentication unavailable",
      message: "Supabase authentication is not configured on the server.",
    });
    return;
  }

  const parsed = developmentSignupSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid signup",
      message: parsed.error.issues[0]?.message ?? "Invalid account details.",
    });
    return;
  }

  const { fullName, email, password } = parsed.data;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    const isDuplicate = error?.message.toLowerCase().includes("already");
    response.status(isDuplicate ? 409 : 422).json({
      error: "Signup failed",
      message: error?.message ?? "The development account could not be created.",
    });
    return;
  }

  response.status(201).json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}

export function getCurrentUser(request: Request, response: Response) {
  const user = request.user;

  if (!user) {
    response.status(401).json({
      error: "Unauthorized",
      message: "No authenticated user is attached to this request.",
    });
    return;
  }

  response.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      fullName:
        typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : null,
    },
  });
}
