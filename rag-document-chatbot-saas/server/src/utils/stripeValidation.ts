import { z } from "zod";

export const checkoutRequestSchema = z.object({
  plan: z.enum(["pro", "team"]),
});
