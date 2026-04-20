import mongoose from "mongoose";
import { ENV } from "../../env";
import { TelemetryModel } from "../modules/telemetry/telemetry.model";
import { AlertModel } from "../modules/alerts/alert.model";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(`✅ MongoDB successfully connected to cluster: ${conn.connection.host}`);

    // Explicitly sync indexes to ensure they build on Cloud Atlas correctly
    await TelemetryModel.syncIndexes();
    await AlertModel.syncIndexes();
    console.log(`✅ MongoDB Indexes successfully synchronized!`);

  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};
