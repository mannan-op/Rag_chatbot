import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
import stripeWebhookRoutes from "./routes/stripeWebhookRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use("/api/stripe/webhook", stripeWebhookRoutes);
app.use(express.json());

app.use(healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/documents", authMiddleware, documentRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);
app.use("/api/stripe", authMiddleware, stripeRoutes);

app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});
