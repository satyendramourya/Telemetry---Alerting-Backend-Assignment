import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "../env";

const PORT = ENV.PORT;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log("==========================================");
    console.log(`🚀 Telemetry Server running on port ${PORT}`);
    console.log(`📡 Ingestion API: POST http://localhost:${PORT}/api/v1/telemetry`);
    console.log("==========================================");
  });
}

start();
