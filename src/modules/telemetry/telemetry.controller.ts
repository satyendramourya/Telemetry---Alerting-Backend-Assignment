import { Request, Response, NextFunction } from "express";
import { TelemetryService } from "./telemetry.service";

export class TelemetryController {
  static async createTelemetry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await TelemetryService.processTelemetry(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getLatest(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = await TelemetryService.getLatest(id);
      if (!data) {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(
    req: Request<{ id: string }, {}, {}, { from?: string; to?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        res.status(400).json({
          success: false,
          message: "Missing 'from' or 'to' query parameters",
        });
        return;
      }

      if (isNaN(Date.parse(from as string)) || isNaN(Date.parse(to as string))) {
        res.status(400).json({
          success: false,
          message: "Invalid 'from' or 'to' date format",
        });
        return;
      }

      const data = await TelemetryService.getHistory(
        id,
        new Date(from),
        new Date(to)
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
