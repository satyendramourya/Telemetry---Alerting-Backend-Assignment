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
}
