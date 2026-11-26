"use client";

import { useEffect, useState } from "react";
import { Copy, Download, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = {
  apiKeyConfigured: boolean;
  apiKeyHint: string | null;
  apiKey: string | null;
  serverUrl: string | null;
  installerReady: boolean;
  recentSyncs: Array<{ at: string; deviceId: string | null; detail: string | null }>;
};

export function SyncAgentPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sync/agent/status", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดสถานะไม่สำเร็จ");
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดสถานะไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function testConnection() {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/sync/agent/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || `HTTP ${data.status || res.status}`);
      }
      setMessage(`เชื่อมต่อสำเร็จ (${data.ms} ms) — ${data.target}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทดสอบไม่สำเร็จ");
    } finally {
      setTesting(false);
    }
  }

  async function downloadInstaller() {
    setDownloading(true);
    setMessage(null);
    setError(null);
    try {
      const serverUrl = window.location.origin;
      const res = await fetch(
        `/api/sync/agent/download?serverUrl=${encodeURIComponent(serverUrl)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ดาวน์โหลดไม่สำเร็จ");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TSL-Asset-Sync-1.0.0-Setup.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(
        "ดาวน์โหลดแล้ว — ZIP นี้แนบ API key ไว้ใน install-defaults.json แล้ว เปิด Setup.cmd จะกรอกให้อัตโนมัติ",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(false);
    }
  }

  async function copyKey() {
    if (!status?.apiKey) return;
    try {
      await navigator.clipboard.writeText(status.apiKey);
      setMessage("คัดลอก API key แล้ว");
    } catch {
      setError("คัดลอกไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          ตัว Sync Agent (เครื่อง client)
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          ดาวน์โหลดจากหน้านี้จะแนบ <code className="text-xs">SYNC_AGENT_API_KEY</code>{" "}
          เข้าไปในตัวติดตั้งให้กรอกอัตโนมัติ
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void downloadInstaller()}
          disabled={downloading || loading || !status?.apiKeyConfigured || status?.installerReady === false}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          ดาวน์โหลดตัวติดตั้ง (แนบ API key)
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void testConnection()}
          disabled={testing || loading}
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlugZap className="h-4 w-4" />
          )}
          ทดสอบการเชื่อมต่อ
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadStatus()}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          รีเฟรชสถานะ
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลดสถานะ...</p>
      ) : (
        <div className="space-y-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-500">Server URL</dt>
              <dd className="font-medium text-slate-900">
                {status?.serverUrl || "-"}
              </dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt className="text-xs text-slate-500">ไฟล์ติดตั้ง</dt>
              <dd className="font-medium text-slate-900">
                {status?.installerReady ? "พร้อมดาวน์โหลด" : "ยังไม่มีไฟล์ใน release/"}
              </dd>
            </div>
          </dl>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-slate-500">SYNC_AGENT_API_KEY</div>
                <div className="mt-1 font-mono text-sm text-slate-900 break-all">
                  {status?.apiKey
                    ? showKey
                      ? status.apiKey
                      : status.apiKeyHint
                    : "ยังไม่ตั้งค่าใน .env"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!status?.apiKey}
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? "ซ่อน" : "แสดง"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!status?.apiKey}
                  onClick={() => void copyKey()}
                >
                  <Copy className="h-3.5 w-3.5" />
                  คัดลอก
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message ? (
        <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {status?.recentSyncs && status.recentSyncs.length > 0 ? (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sync ล่าสุด
          </h4>
          <ul className="space-y-1 text-sm text-slate-700">
            {status.recentSyncs.map((s, i) => (
              <li key={`${s.at}-${i}`} className="truncate">
                {new Date(s.at).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                })}
                {" · "}
                {s.deviceId || "-"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
        <li>กดดาวน์โหลดตัวติดตั้ง (แนบ API key) จากหน้านี้</li>
        <li>แตก ZIP แล้วดับเบิลคลิก Setup.cmd</li>
        <li>ฟอร์มจะกรอก URL/API key ให้แล้ว — เลือกไฟล์ Excel แล้วกดติดตั้ง</li>
      </ol>
    </div>
  );
}
