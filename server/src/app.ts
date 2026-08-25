import express, { Express } from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import habitRoutes from "./routes/habit.routes";

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.clientUrl }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found." } });
  });

  app.use(errorHandler);

  return app;
}
