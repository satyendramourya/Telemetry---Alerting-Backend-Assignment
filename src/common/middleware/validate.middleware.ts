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
