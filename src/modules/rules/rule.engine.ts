import { AlertSeverity } from "../../common/constants/enums";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface INewAlert {
  rule: string;
  severity: AlertSeverity | string;
}

/**
 * A single rule definition.
 * - `name`     — unique rule identifier stored on the alert document
 * - `severity` — severity level emitted when the rule fires
 * - `evaluate` — pure function: receives the incoming telemetry + sorted
 *                chronological history (oldest→newest, NOT including the
 *                current reading).  Returns true when the alert should fire.
 */
export interface Rule {
  name: string;
  severity: AlertSeverity;
  evaluate: (telemetry: any, history: any[]) => boolean;
}

// ────────────────────────────────────────────────────────────
// RuleEngine — in-memory, pluggable rule registry
// ────────────────────────────────────────────────────────────

class RuleEngine {
  private rules: Rule[] = [];

  /** Register a rule. Duplicate names are silently replaced. */
  register(rule: Rule): this {
    this.rules = this.rules.filter((r) => r.name !== rule.name);
    this.rules.push(rule);
    return this;
  }

  /**
   * Evaluate all registered rules against the incoming telemetry.
   * @param telemetry  The telemetry reading that was just ingested.
   * @param history    Chronological past readings (oldest→newest),
   *                   NOT including the current reading.
   */
  evaluate(telemetry: any, history: any[]): INewAlert[] {
    const alerts: INewAlert[] = [];

    for (const rule of this.rules) {
      if (rule.evaluate(telemetry, history)) {
        alerts.push({ rule: rule.name, severity: rule.severity });
      }
    }

    return alerts;
  }
}

// ────────────────────────────────────────────────────────────
// Singleton instance — rules registered once at startup
// ────────────────────────────────────────────────────────────

export const ruleEngine = new RuleEngine()
  .register({
    name: "metricA_high",
    severity: AlertSeverity.WARNING,
    evaluate: (t) => t.readings?.metricA > 100,
  })
  .register({
    name: "metricB_low",
    severity: AlertSeverity.CRITICAL,
    evaluate: (t) => t.readings?.metricB < 50,
  })
  .register({
    name: "device_offline",
    severity: AlertSeverity.CRITICAL,
    // Fires when metricC=0 for 3 consecutive readings (past 2 + current)
    evaluate: (t, history) => {
      const last3 = [...history, t].slice(-3);
      return last3.length === 3 && last3.every((r) => r.readings?.metricC === 0);
    },
  });

// ────────────────────────────────────────────────────────────
// Backward-compatible export so existing callers still compile
// ────────────────────────────────────────────────────────────
export const evaluateRules = (telemetry: any, history: any[]): INewAlert[] =>
  ruleEngine.evaluate(telemetry, history);
