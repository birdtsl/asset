#!/usr/bin/env node
/**
 * TSL Smart Asset — desktop sync agent (phase A)
 * Reads Excel sheet "chek", diffs against local snapshot, POSTs only changes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseChekFile } from "./lib/parse-chek.mjs";

function getAppDir() {
  const candidates = [];
  // portable layout: <install>/runtime/node.exe → config at <install>/
  const execDir = path.dirname(process.execPath);
  if (path.basename(execDir).toLowerCase() === "runtime") {
    candidates.push(path.dirname(execDir));
  }
  if (process.pkg) candidates.push(path.dirname(process.execPath));
  candidates.push(execDir);
  candidates.push(process.cwd());
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    candidates.push(here);
    candidates.push(path.dirname(here)); // app/ → install root
  } catch {
    /* bundled cjs may not expose import.meta */
  }
  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, "config.json"))) return dir;
  }
  return candidates[0] || process.cwd();
}

const appDir = getAppDir();
const configPath = process.argv.includes("--config")
  ? path.resolve(process.argv[process.argv.indexOf("--config") + 1])
  : path.join(appDir, "config.json");

function log(...args) {
  const ts = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  console.log(`[${ts}]`, ...args);
}

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `ไม่พบ config: ${configPath}\nคัดลอก config.example.json เป็น config.json แล้วแก้ค่า`,
    );
  }
  const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!cfg.serverUrl || !cfg.apiKey || !cfg.deviceId) {
    throw new Error("config ต้องมี serverUrl, apiKey, deviceId");
  }
  if (!Array.isArray(cfg.sources) || cfg.sources.length === 0) {
    throw new Error("config.sources ว่าง");
  }
  return cfg;
}

function loadState(stateFile) {
  if (!fs.existsSync(stateFile)) {
    return { version: 1, files: {}, hashes: {} };
  }
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function saveState(stateFile, state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
}

async function postDelta(cfg, payload) {
  const url = new URL("/api/sync/assets", cfg.serverUrl).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sync-Key": cfg.apiKey,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `API ${res.status}: ${body.error || text.slice(0, 300)}`,
    );
  }
  return body;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function syncOnce(cfg) {
  const stateFile = path.isAbsolute(cfg.stateFile || "")
    ? cfg.stateFile
    : path.resolve(appDir, cfg.stateFile || "./.sync-state.json");
  const state = loadState(stateFile);
  const batchSize = Math.min(Number(cfg.batchSize || 200), 500);

  let totalRead = 0;
  let totalChanged = 0;
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const source of cfg.sources) {
    const filePath = path.resolve(source.path);
    if (!fs.existsSync(filePath)) {
      log("ข้าม — ไม่พบไฟล์", filePath);
      continue;
    }

    const assetClass = source.assetClass === "LOW_VALUE" ? "LOW_VALUE" : "NORMAL";
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);
    const parsed = parseChekFile(buffer, assetClass);
    log(
      `อ่าน ${path.basename(filePath)} ชีต=${parsed.sheetName || "-"} แถว=${parsed.rows.length}`,
    );
    totalRead += parsed.rows.length;

    const changed = [];
    for (const row of parsed.rows) {
      if (!row.assetCode || !row.itemName) continue;
      const hashKey = `${row.assetClass}:${row.assetCode}`;
      const prev = state.hashes[hashKey];
      if (prev === row.contentHash) continue;
      changed.push(row);
    }

    log(`เปลี่ยนแปลง ${changed.length} รายการ (${assetClass})`);
    totalChanged += changed.length;

    for (const part of chunk(changed, batchSize)) {
      const result = await postDelta(cfg, {
        deviceId: cfg.deviceId,
        sourceFile: path.basename(filePath),
        rows: part,
      });
      totalCreated += result.created || 0;
      totalUpdated += result.updated || 0;
      if (result.errors?.length) {
        log("errors", result.errors.slice(0, 5));
      }
      for (const row of part) {
        state.hashes[`${row.assetClass}:${row.assetCode}`] = row.contentHash;
      }
      saveState(stateFile, state);
      log(
        `ส่งแล้ว +${result.created || 0} ~${result.updated || 0} (ชุด ${part.length})`,
      );
    }

    state.files[filePath] = {
      mtimeMs: stat.mtimeMs,
      size: stat.size,
      rowCount: parsed.rows.length,
      assetClass,
      lastSyncAt: new Date().toISOString(),
    };
    saveState(stateFile, state);
  }

  return { totalRead, totalChanged, totalCreated, totalUpdated };
}

async function ping(cfg) {
  const url = new URL("/api/sync/assets", cfg.serverUrl).toString();
  const res = await fetch(url, {
    headers: { "X-Sync-Key": cfg.apiKey },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ping failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  const cfg = loadConfig();
  log("device=", cfg.deviceId, "server=", cfg.serverUrl);

  if (process.argv.includes("--ping")) {
    const p = await ping(cfg);
    log("ping ok", p);
    return;
  }

  const result = await syncOnce(cfg);
  log("เสร็จ", result);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
