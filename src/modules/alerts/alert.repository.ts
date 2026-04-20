import { AlertModel } from "./alert.model";
import { INewAlert } from "../rules/rule.engine";
import { AlertStatus } from "../../common/constants/enums";

export class AlertRepository {
  static async createAlerts(deviceId: string, alerts: INewAlert[]) {
    for (const alert of alerts) {
      try {
        await AlertModel.create({
          deviceId,
          rule: alert.rule,
          severity: alert.severity,
          status: AlertStatus.OPEN,
        });
      } catch (err: any) {
        // Ignore E11000 duplicate key error for OPEN alerts due to partial unique index
        if (err.code !== 11000) {
          throw err;
        }
      }
    }
  }

  static async findAlerts(filter: any, skip: number, limit: number, sort: any) {
    return AlertModel.find(filter).skip(skip).limit(limit).sort(sort);
  }
}
