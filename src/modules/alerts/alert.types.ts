import { Document } from "mongoose";
import { AlertStatus, AlertSeverity } from "../../common/constants/enums";

export interface IAlert {
  deviceId: string;
  rule: string;
  severity: AlertSeverity | string;
  status: AlertStatus | string;
}

export interface IAlertDocument extends IAlert, Document {
  createdAt: Date;
  updatedAt: Date;
}
