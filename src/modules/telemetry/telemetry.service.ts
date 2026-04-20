import { TelemetryRepository } from "./telemetry.repository";
import { AlertRepository } from "../alerts/alert.repository";
import { evaluateRules } from "../rules/rule.engine";
import { ITelemetry } from "./telemetry.types";

export class TelemetryService {
  static async processTelemetry(data: ITelemetry) {
    try {
      // 2. Insert telemetry
      await TelemetryRepository.insertTelemetry(data);
    } catch (err: any) {
      if (err.code === 11000) {
        // Idempotency: Duplicate telemetry, just return successfully or ignore
        return { success: true, message: "Duplicate telemetry ignored" };
      }
      throw err;
    }

    // 3. Fetch last 2 readings
    // Let's fetch 2 because the new one is already in DB, 
    // so we get top 3 including the current one for rule evaluation.
    // Wait, the engine checks 'last3'.
    // Fetching last 3 (which includes the one we just inserted).
    const historyDocs = await TelemetryRepository.getHistory(data.deviceId, 3);
    
    // Sort array in chronological order for the rule engine slice logic
    const chronologicalHistory = historyDocs.reverse();
    // exclude the last one which is the current telemetry
    const pastHistory = chronologicalHistory.slice(0, -1);

    // 4. Run rule engine
    const alerts = evaluateRules(data, pastHistory);

    // 5. Create alerts (if needed)
    if (alerts.length > 0) {
      await AlertRepository.createAlerts(data.deviceId, alerts);
    }

    return { success: true };
  }

  static async getLatest(deviceId: string) {
    return TelemetryRepository.getLatest(deviceId);
  }

  static async getHistory(deviceId: string, from: Date, to: Date) {
    return TelemetryRepository.getRange(deviceId, from, to);
  }

  /**
   * Bulk ingestion:
   * 1. insertMany with ordered:false — duplicates are skipped, rest inserted.
   * 2. For each unique deviceId in the successfully inserted docs, fetch
   *    recent history and run the rule engine.
   * 3. Persist any generated alerts.
   * Returns a summary: inserted, duplicatesSkipped, alertsGenerated.
   */
  static async processBulkTelemetry(docs: ITelemetry[]) {
    let inserted = 0;
    let duplicatesSkipped = 0;

    try {
      const result = await TelemetryRepository.bulkInsertTelemetry(docs);
      inserted = result.length;
      duplicatesSkipped = docs.length - inserted;
    } catch (err: any) {
      // insertMany ordered:false throws a BulkWriteError but still
      // populates err.insertedDocs / err.result for successful writes.
      if (err.name !== "MongoBulkWriteError") throw err;

      inserted = err.insertedCount ?? 0;
      duplicatesSkipped = docs.length - inserted;
    }

    // Group inserted docs by deviceId to minimise DB round-trips
    const deviceIds = [...new Set(docs.map((d) => d.deviceId))];
    let alertsGenerated = 0;

    await Promise.all(
      deviceIds.map(async (deviceId) => {
        const latestDoc = docs
          .filter((d) => d.deviceId === deviceId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const historyDocs = await TelemetryRepository.getHistory(deviceId, 3);
        const chronological = historyDocs.reverse();
        const pastHistory = chronological.slice(0, -1);

        const alerts = evaluateRules(latestDoc, pastHistory);
        if (alerts.length > 0) {
          await AlertRepository.createAlerts(deviceId, alerts);
          alertsGenerated += alerts.length;
        }
      })
    );

    return { success: true, inserted, duplicatesSkipped, alertsGenerated };
  }
}
