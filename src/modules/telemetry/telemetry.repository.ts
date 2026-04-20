import { TelemetryModel } from "./telemetry.model";
import { ITelemetry } from "./telemetry.types";

export class TelemetryRepository {
  static async insertTelemetry(data: ITelemetry) {
    const doc = new TelemetryModel(data);
    return doc.save();
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
