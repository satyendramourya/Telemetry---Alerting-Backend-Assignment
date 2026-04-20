import { Document } from "mongoose";

export interface IReadings {
  metricA?: number;
  metricB?: number;
  metricC?: number;
}

export interface ITelemetry {
  deviceId: string;
  sourceId: string;
  timestamp: Date;
  readings: IReadings;
}

export interface ITelemetryDocument extends ITelemetry, Document {
  createdAt: Date;
  updatedAt: Date;
}
