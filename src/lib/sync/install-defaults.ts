import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

export type InstallDefaults = {
  serverUrl: string;
  apiKey: string;
  deviceId?: string;
  intervalMinutes?: number;
};

export function getInstallDefaults(): InstallDefaults | null {
  const apiKey = process.env.SYNC_AGENT_API_KEY?.trim() || "";
  if (!apiKey) return null;
  const serverUrl = (
    process.env.APP_URL?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return { serverUrl, apiKey };
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

/** Build a setup zip that includes install-defaults.json (API key + server URL). */
export function buildInstallerZipWithDefaults(defaults: InstallDefaults): Buffer {
  const packageDir = path.join(process.cwd(), "sync-agent", "dist", "package");
  const releaseZip = path.join(
    process.cwd(),
    "sync-agent",
    "release",
    "TSL-Asset-Sync-1.0.0-Setup.zip",
  );

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "tsl-sync-setup-"));
  const staged = path.join(work, "payload");
  fs.mkdirSync(staged, { recursive: true });

  try {
    if (fs.existsSync(packageDir)) {
      copyDir(packageDir, staged);
    } else if (fs.existsSync(releaseZip)) {
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Expand-Archive -LiteralPath '${releaseZip.replace(/'/g, "''")}' -DestinationPath '${staged.replace(/'/g, "''")}' -Force`,
        ],
        { stdio: "pipe" },
      );
    } else {
      throw new Error(
        "ยังไม่มีไฟล์ติดตั้ง — รัน npm run build ในโฟลเดอร์ sync-agent ก่อน",
      );
    }

    fs.writeFileSync(
      path.join(staged, "install-defaults.json"),
      JSON.stringify(
        {
          serverUrl: defaults.serverUrl,
          apiKey: defaults.apiKey,
          deviceId: defaults.deviceId || "",
          intervalMinutes: defaults.intervalMinutes || 15,
          note: "สร้างอัตโนมัติตอนดาวน์โหลดจากระบบ — ใช้กรอกฟอร์มติดตั้งให้",
        },
        null,
        2,
      ),
      "utf8",
    );

    const outZip = path.join(work, "TSL-Asset-Sync-1.0.0-Setup.zip");
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path '${staged.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "pipe" },
    );

    return fs.readFileSync(outZip);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}
