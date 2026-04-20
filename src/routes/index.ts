import { Router } from "express";
import { TelemetryController } from "../modules/telemetry/telemetry.controller";
import { AlertController } from "../modules/alerts/alert.controller";
import { validateTelemetryPayload } from "../common/middleware/validate.middleware";

const router = Router();

// Telemetry Logic
router.post(
  "/telemetry",
  validateTelemetryPayload,
  TelemetryController.createTelemetry
);

router.get("/devices/:id/latest", TelemetryController.getLatest);
router.get("/devices/:id/history", TelemetryController.getHistory);

// Alert Logic
router.get("/alerts", AlertController.getAlerts);

export default router;
