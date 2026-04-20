import mongoose from "mongoose";
import { ENV } from "../../env";
import { TelemetryModel } from "../modules/telemetry/telemetry.model";
import { AlertModel } from "../modules/alerts/alert.model";
import { logger } from "../common/utils/logger";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    logger.info({ host: conn.connection.host }, "✅ MongoDB successfully connected");

    // Explicitly sync indexes to ensure they build on Cloud Atlas correctly
    await TelemetryModel.syncIndexes();
    await AlertModel.syncIndexes();
    logger.info("✅ MongoDB Indexes successfully synchronized!");

  } catch (error) {
    logger.fatal({ error }, "MongoDB connection failed");
    process.exit(1);
  }
};
