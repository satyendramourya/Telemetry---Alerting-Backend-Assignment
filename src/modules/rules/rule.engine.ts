import { ITelemetry } from "../telemetry/telemetry.types";
import { AlertSeverity } from "../../common/constants/enums";

export interface INewAlert {
  rule: string;
  severity: AlertSeverity | string;
}

export const evaluateRules = (
  telemetry: any,
  history: any[]
): INewAlert[] => {
  const alerts: INewAlert[] = [];

  if (telemetry.readings?.metricA > 100) {
    alerts.push({ rule: "metricA_high", severity: "WARNING" });
  }

  if (telemetry.readings?.metricB < 50) {
    alerts.push({ rule: "metricB_low", severity: "CRITICAL" });
  }

  // consecutive logic
  const last3 = [...history, telemetry].slice(-3);

  if (
    last3.length === 3 &&
    last3.every((t) => t.readings?.metricC === 0)
  ) {
    alerts.push({ rule: "device_offline", severity: "CRITICAL" });
  }

  return alerts;
};
