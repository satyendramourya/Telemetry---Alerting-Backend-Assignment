import { Request, Response, NextFunction } from "express";
import { AlertService } from "./alert.service";

export class AlertController {
  static async getAlerts(
    req: Request<{}, {}, {}, { status?: string; severity?: string; page?: string; limit?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, severity, page, limit } = req.query;

      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      const data = await AlertService.getAlerts(
        status,
        severity,
        pageNum,
        limitNum
      );

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
