import http from "http";
import mongoose from "mongoose";
import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "../env";
import { logger } from "./common/utils/logger";

const PORT = ENV.PORT;

async function start() {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info({ port: PORT }, `🚀 Telemetry Server running`);
    logger.info(`📡 Ingestion API: POST http://localhost:${PORT}/api/v1/telemetry`);
    logger.info(`📦 Bulk API:      POST http://localhost:${PORT}/api/v1/telemetry/bulk`);
  });

  // ──────────────────────────────────────────────────────────
  // Graceful shutdown
  // Triggered by: SIGTERM (container orchestrators e.g. K8s)
  //               SIGINT  (Ctrl+C in terminal)
  // ──────────────────────────────────────────────────────────
  const shutdown = (signal: string) => async () => {
    logger.info({ signal }, "Shutdown signal received — draining connections...");

    // 1. Stop accepting new HTTP connections
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Error while closing HTTP server");
        process.exit(1);
      }

      // 2. Close MongoDB connection cleanly
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed gracefully");
      } catch (dbErr) {
        logger.error({ err: dbErr }, "Error closing MongoDB connection");
      }

      logger.info("Shutdown complete. Goodbye 👋");
      process.exit(0);
    });

    // 3. Force-kill if drain takes too long (30s safety net)
    setTimeout(() => {
      logger.error("Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 30_000).unref();
  };

  process.on("SIGTERM", shutdown("SIGTERM"));
  process.on("SIGINT",  shutdown("SIGINT"));

  // Catch unhandled promise rejections to prevent silent crashes
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ reason }, "Unhandled promise rejection — shutting down");
    process.exit(1);
  });
}

start();
