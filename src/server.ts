import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "../env";
import { logger } from "./common/utils/logger";

const PORT = ENV.PORT;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `🚀 Telemetry Server running`);
    logger.info(`📡 Ingestion API: POST http://localhost:${PORT}/api/v1/telemetry`);
  });
}

start();
