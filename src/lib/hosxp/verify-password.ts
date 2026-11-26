import { createHash } from "crypto";
import { queryHosxp } from "@/lib/hosxp/mysql";

function md5Hex(s: string) {
  return createHash("md5").update(s, "utf8").digest("hex");
}

function sqlId(id: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(id)) throw new Error("Invalid SQL identifier");
  return `\`${id}\``;
}

type OpdUserColumnInfo = {
  userCols: string[];
  passCols: string[];
  hasName: boolean;
  hasOfficerName: boolean;
  hasAccountDisable: boolean;
};

let opdUserColumnsCache: { value: OpdUserColumnInfo; expiresAt: number } | null =
  null;
const OPD_USER_COLUMNS_TTL_MS = 60 * 60 * 1000;
let opdUserColumnsInflight: Promise<OpdUserColumnInfo> | null = null;

async function introspectOpdUserColumns(): Promise<OpdUserColumnInfo> {
  const now = Date.now();
  if (opdUserColumnsCache && opdUserColumnsCache.expiresAt > now) {
    return opdUserColumnsCache.value;
  }
  if (opdUserColumnsInflight) return opdUserColumnsInflight;

  opdUserColumnsInflight = (async () => {
    const { rows, error } = await queryHosxp(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'opduser'",
    );

    let value: OpdUserColumnInfo;
    if (error || !rows.length) {
      value = {
        userCols: ["loginname", "usercode"],
        passCols: ["passweb", "password"],
        hasName: false,
        hasOfficerName: false,
        hasAccountDisable: false,
      };
    } else {
      const colNames = rows
        .map((r) => String(r.COLUMN_NAME ?? r.column_name ?? ""))
        .filter(Boolean);

      // Prefer loginname first — matches รพ.ทุ่งเสลี่ยม HOSxP / ERP TSL
      const userAllow = [
        "loginname",
        "usercode",
        "userid",
        "username",
        "user",
        "login",
        "staffcode",
        "empcode",
      ];
      const passAllow = [
        "passweb",
        "password",
        "pass",
        "passord",
        "passweb1",
        "passweb2",
      ];

      const userCols = userAllow.filter((x) => colNames.includes(x));
      const passCols = passAllow.filter((x) => colNames.includes(x));

      value = {
        userCols: userCols.length ? userCols : ["loginname"],
        passCols: passCols.length ? passCols : ["passweb"],
        hasName: colNames.includes("name"),
        hasOfficerName: colNames.includes("officer_name"),
        hasAccountDisable: colNames.includes("account_disable"),
      };
    }

    opdUserColumnsCache = {
      value,
      expiresAt: Date.now() + OPD_USER_COLUMNS_TTL_MS,
    };
    return value;
  })().finally(() => {
    opdUserColumnsInflight = null;
  });

  return opdUserColumnsInflight;
}

function pickOpdDisplayName(
  row: Record<string, unknown>,
  hasName: boolean,
  hasOfficerName: boolean,
): string | undefined {
  if (hasName) {
    const v = row.opd_name ?? row.OPD_NAME;
    if (v != null && String(v).trim()) return String(v).trim().slice(0, 128);
  }
  if (hasOfficerName) {
    const v = row.officer_name ?? row.OFFICER_NAME;
    if (v != null && String(v).trim()) return String(v).trim().slice(0, 128);
  }
  return undefined;
}

/** Same credential check as ERP TSL against HOSxP `opduser`. */
export async function verifyHosxpUserPassword(
  user: string,
  password: string,
): Promise<{ ok: boolean; reason?: string; displayName?: string }> {
  const cleanUser = String(user ?? "").trim().slice(0, 64);
  const cleanPass = String(password ?? "").slice(0, 256);
  if (!cleanUser || !cleanPass) {
    return { ok: false, reason: "user/password is required" };
  }

  const { userCols, passCols, hasName, hasOfficerName, hasAccountDisable } =
    await introspectOpdUserColumns();
  const userCol = userCols[0];
  const chosenPassCols = passCols.slice(0, 4);

  const nameSelect = hasName ? `${sqlId("name")} as opd_name,\n      ` : "";
  const officerSelect = hasOfficerName
    ? `${sqlId("officer_name")} as officer_name,\n      `
    : "";
  const disableSelect = hasAccountDisable
    ? `${sqlId("account_disable")} as account_disable,\n      `
    : "";

  const sql = `
    SELECT ${sqlId(userCol)} as u,
      ${nameSelect}${officerSelect}${disableSelect}${chosenPassCols
        .map((c, i) => `${sqlId(c)} as p_${i}`)
        .join(",\n      ")}
    FROM opduser
    WHERE ${sqlId(userCol)} = ?
    LIMIT 1
  `.trim();

  const { rows, error } = await queryHosxp(sql, [cleanUser]);
  if (error) return { ok: false, reason: error };
  const row0 = rows[0] as Record<string, unknown> | undefined;
  if (!row0) return { ok: false, reason: "invalid credentials" };

  if (hasAccountDisable) {
    const disabled = row0.account_disable;
    if (
      disabled === "Y" ||
      disabled === "y" ||
      disabled === 1 ||
      disabled === "1" ||
      disabled === true
    ) {
      return { ok: false, reason: "account disabled" };
    }
  }

  const displayName = pickOpdDisplayName(row0, hasName, hasOfficerName);

  const storedCandidates = chosenPassCols
    .map((_, i) => {
      const v = row0[`p_${i}`];
      if (v === null || v === undefined) return null;
      return String(v).trim();
    })
    .filter((v): v is string => !!v);

  if (storedCandidates.length === 0) {
    return { ok: false, reason: "no password set" };
  }

  const passMd5 = md5Hex(cleanPass).toLowerCase();
  const userPassMd5 = md5Hex(`${cleanUser}${cleanPass}`).toLowerCase();
  const passUserMd5 = md5Hex(`${cleanPass}${cleanUser}`).toLowerCase();

  if (storedCandidates.some((s) => s === cleanPass)) {
    return { ok: true, displayName };
  }

  const md5Match = storedCandidates.some((s) => {
    const v = s.toLowerCase();
    return v === passMd5 || v === userPassMd5 || v === passUserMd5;
  });

  if (md5Match) return { ok: true, displayName };
  return { ok: false, reason: "invalid credentials" };
}
