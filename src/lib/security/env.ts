const REQUIRED = ["DATABASE_URL", "AUTH_SECRET"] as const;

export function getEnvSecurityReport() {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  const authSecret = process.env.AUTH_SECRET || "";
  const weakSecret =
    authSecret.length > 0 &&
    (authSecret.length < 16 ||
      authSecret === "generate-a-strong-secret" ||
      authSecret === "secret");

  return {
    ok: missing.length === 0 && !weakSecret,
    missing,
    weakSecret,
    appUrl: process.env.APP_URL || null,
    timezone: process.env.TZ || "Asia/Bangkok",
    storageRoot: process.env.STORAGE_ROOT || "./storage",
    hasOpenAi: Boolean(process.env.OPENAI_API_KEY),
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

export function assertProductionEnv() {
  const report = getEnvSecurityReport();
  if (process.env.NODE_ENV === "production" && !report.ok) {
    const reasons = [
      ...report.missing.map((m) => `missing ${m}`),
      ...(report.weakSecret ? ["weak AUTH_SECRET"] : []),
    ];
    throw new Error(`Production env insecure: ${reasons.join(", ")}`);
  }
  return report;
}
