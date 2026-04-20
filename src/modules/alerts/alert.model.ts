import mongoose from "mongoose";
import { AlertStatus, AlertSeverity } from "../../common/constants/enums";

const alertSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    rule: { type: String, required: true },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(AlertStatus),
      default: AlertStatus.OPEN,
    },
  },
  { timestamps: true }
);

// Prevent duplicate OPEN alerts
alertSchema.index(
  { deviceId: 1, rule: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: AlertStatus.OPEN } }
);

// ✅ Query optimization for read-heavy GET /alerts?status=open&severity=critical
alertSchema.index({ status: 1, severity: 1, createdAt: -1 });

export const AlertModel = mongoose.model("Alert", alertSchema);
