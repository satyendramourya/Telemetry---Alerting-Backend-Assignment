import { TelemetryModel } from "./telemetry.model";
import { ITelemetry } from "./telemetry.types";

export class TelemetryRepository {
  static async insertTelemetry(data: ITelemetry) {
    const doc = new TelemetryModel(data);
    return doc.save();
  }

  /**
   * Bulk insert with ordered:false so a duplicate key error on one document
   * does not abort the entire batch — all valid documents still persist.
   * Returns the raw WriteResult for the caller to inspect insertedCount.
   */
  static async bulkInsertTelemetry(docs: ITelemetry[]) {
    return TelemetryModel.insertMany(docs, {
      ordered: false,   // continue on duplicate key errors
      lean: true,
    });
  }

  static async getHistory(deviceId: string, limit: number) {
    return TelemetryModel.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  static async getLatest(deviceId: string) {
    return TelemetryModel.findOne({ deviceId }).sort({ timestamp: -1 }).lean();
  }

  static async getRange(deviceId: string, from: Date, to: Date) {
    return TelemetryModel.find({
      deviceId,
      timestamp: { $gte: from, $lte: to },
    })
      .sort({ timestamp: -1 })
      .lean();
  }
}
