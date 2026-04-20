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
    const sort = { createdAt: -1 };

    const alerts = await AlertRepository.findAlerts(
      filter,
      skip,
      limit,
      sort
    );

    return alerts;
  }
}
