import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: required("MONGODB_URI", "mongodb://localhost:27017/habit-tracker"),
  jwtSecret: required("JWT_SECRET"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};
