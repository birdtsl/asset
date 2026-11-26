"use client";

import { useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssetQrPanel({
  assetId,
  initialUrl,
}: {
  assetId: string;
  initialUrl?: string | null;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "สร้าง QR ไม่สำเร็จ");
      setUrl(json.data.url);
      setDataUrl(json.data.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        {url ? "สร้าง/แสดง QR" : "สร้าง QR Code"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {url ? (
        <p className="break-all text-xs text-slate-500">
          <a href={url} target="_blank" className="text-teal-700 hover:underline">
            {url}
          </a>
        </p>
      ) : null}
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Asset QR" className="h-40 w-40 rounded border border-slate-200" />
      ) : null}
    </div>
  );
}
