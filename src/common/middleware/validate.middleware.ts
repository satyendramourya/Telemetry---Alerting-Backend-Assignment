import { Request, Response, NextFunction } from "express";

export const validateTelemetryPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { deviceId, sourceId, timestamp, readings } = req.body;

  if (!deviceId || typeof deviceId !== "string") {
    res.status(400).json({ success: false, message: "Invalid or missing deviceId" });
    return;
  }
  if (!sourceId || typeof sourceId !== "string") {
    res.status(400).json({ success: false, message: "Invalid or missing sourceId" });
    return;
  }
  if (!timestamp || isNaN(Date.parse(timestamp))) {
    res.status(400).json({ success: false, message: "Invalid or missing timestamp" });
    return;
  }
  if (!readings || typeof readings !== "object") {
    res.status(400).json({ success: false, message: "Invalid or missing readings" });
    return;
  }

  next();
};

/**
 * Validates a bulk telemetry array payload.
 * Enforces: non-empty array, cap at 500 items, each item is a valid telemetry object.
 */
export const validateBulkTelemetryPayload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body = req.body;

  if (!Array.isArray(body) || body.length === 0) {
    res.status(400).json({ success: false, message: "Request body must be a non-empty array" });
    return;
  }

  if (body.length > 500) {
    res.status(400).json({ success: false, message: "Bulk limit exceeded: max 500 items per request" });
    return;
  }

  for (let i = 0; i < body.length; i++) {
    const { deviceId, sourceId, timestamp, readings } = body[i];
    if (!deviceId || typeof deviceId !== "string") {
      res.status(400).json({ success: false, message: `Item[${i}]: invalid or missing deviceId` });
      return;
    }
    if (!sourceId || typeof sourceId !== "string") {
      res.status(400).json({ success: false, message: `Item[${i}]: invalid or missing sourceId` });
      return;
    }
    if (!timestamp || isNaN(Date.parse(timestamp))) {
      res.status(400).json({ success: false, message: `Item[${i}]: invalid or missing timestamp` });
      return;
    }
    if (!readings || typeof readings !== "object") {
      res.status(400).json({ success: false, message: `Item[${i}]: invalid or missing readings` });
      return;
    }
  }

  next();
};
