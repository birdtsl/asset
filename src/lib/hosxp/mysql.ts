import mysql from "mysql2/promise";

const pools = new Map<string, mysql.Pool>();

function getPool(databaseUrl: string): mysql.Pool {
  let pool = pools.get(databaseUrl);
  if (!pool) {
    pool = mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 5,
      enableKeepAlive: true,
    });
    pools.set(databaseUrl, pool);
  }
  return pool;
}

export function isHosxpConfigured() {
  return Boolean(process.env.HOSXP_DATABASE_URL?.trim());
}

export function isHosxpAuthEnabled() {
  if (!isHosxpConfigured()) return false;
  const flag = (process.env.HOSXP_AUTH_ENABLED ?? "true").trim().toLowerCase();
  return flag !== "0" && flag !== "false" && flag !== "off";
}

export async function queryHosxp(
  sql: string,
  values?: unknown[],
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  const databaseUrl = process.env.HOSXP_DATABASE_URL?.trim();
  if (!databaseUrl) {
    return { rows: [], error: "HOSXP_DATABASE_URL is not set" };
  }

  try {
    const pool = getPool(databaseUrl);
    const opts: mysql.QueryOptions = { sql };
    if (values !== undefined && values.length > 0) {
      opts.values = values;
    }
    const [rows] = await pool.query<mysql.RowDataPacket[]>(opts);
    return { rows: rows as unknown as Record<string, unknown>[] };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : "hosxp query failed",
    };
  }
}
