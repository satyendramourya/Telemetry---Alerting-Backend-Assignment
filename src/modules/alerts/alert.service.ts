import { AlertRepository } from "./alert.repository";

export class AlertService {
  static async getAlerts(
    status?: string,
    severity?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const filter: any = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const skip = (page - 1) * limit;
    const sort = { createdAt: -1 } as const;

    const alerts = await AlertRepository.findAlerts(
      filter,
      skip,
      limit,
      sort
    );

    return alerts;
  }

  static async updateStatus(id: string, status: string) {
    // Relying on mongoose to validate the enum during save/update when passing status. 
    // We import the enum conceptually or just pass standard strings.
    return AlertRepository.updateAlertStatus(id, status as any);
  }
}
