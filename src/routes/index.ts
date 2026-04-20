import { Router } from "express";
import { TelemetryController } from "../modules/telemetry/telemetry.controller";
import { AlertController } from "../modules/alerts/alert.controller";
import { validateTelemetryPayload, validateBulkTelemetryPayload } from "../common/middleware/validate.middleware";

const router = Router();

// Telemetry Logic
router.post(
  "/telemetry",
  validateTelemetryPayload,
  TelemetryController.createTelemetry
);

// Bulk must be registered BEFORE /:id routes to avoid param conflicts
router.post(
  "/telemetry/bulk",
  validateBulkTelemetryPayload,
  TelemetryController.bulkCreateTelemetry
);

router.get("/devices/:id/latest", TelemetryController.getLatest);
router.get("/devices/:id/history", TelemetryController.getHistory);

// Alert Logic
router.get("/alerts", AlertController.getAlerts);
router.patch("/alerts/:id/status", AlertController.updateStatus);

export default router;
