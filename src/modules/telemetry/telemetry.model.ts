import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    sourceId: { type: String, required: true },
    timestamp: { type: Date, required: true },

    readings: {
      metricA: Number,
      metricB: Number,
      metricC: Number,
    },
  },
  { timestamps: true }
);

// ✅ Idempotency
telemetrySchema.index(
  { deviceId: 1, sourceId: 1, timestamp: 1 },
  { unique: true }
);

// ✅ Query optimization
telemetrySchema.index({ deviceId: 1, timestamp: -1 });

export const TelemetryModel = mongoose.model("Telemetry", telemetrySchema);
