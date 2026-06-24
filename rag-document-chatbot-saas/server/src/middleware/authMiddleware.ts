import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";

export async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.header("authorization");
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    response.status(401).json({
      error: "Unauthorized",
      message: "A valid Bearer access token is required.",
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

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(match[1]);

    if (error || !user) {
      response.status(401).json({
        error: "Unauthorized",
        message: "The access token is invalid or expired.",
      });
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(503).json({
      error: "Authentication unavailable",
      message: "The authentication provider could not be reached.",
    });
  }
}
