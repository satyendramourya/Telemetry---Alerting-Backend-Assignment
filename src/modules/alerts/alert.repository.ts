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

  static async findAlerts(filter: any, skip: number, limit: number, sort: Record<string, 1 | -1>) {
    const pipeline: any[] = [
      { $match: filter },
      { $sort: sort },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }],
        },
      },
    ];

    const result = await AlertModel.aggregate(pipeline);
    
    const totalCount = result[0]?.metadata[0]?.total || 0;
    const data = result[0]?.data || [];

    return { totalCount, data, limit, skip };
  }

  static async updateAlertStatus(id: string, status: AlertStatus) {
    return AlertModel.findByIdAndUpdate(id, { status }, { new: true });
  }
}
