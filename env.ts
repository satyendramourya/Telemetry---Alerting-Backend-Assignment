import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb+srv://<username>:<password>@cluster0.znhf6.mongodb.net/telemetry?retryWrites=true&w=majority",
};
