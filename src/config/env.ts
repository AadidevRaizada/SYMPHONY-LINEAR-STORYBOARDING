import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: "LINEAR_API_KEY" | "OPENAI_API_KEY"): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  LINEAR_API_KEY: requireEnv("LINEAR_API_KEY"),
  OPENAI_API_KEY: requireEnv("OPENAI_API_KEY")
} as const;
