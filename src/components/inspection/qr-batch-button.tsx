"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrBatchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true, limit: 500 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "สร้าง QR ไม่สำเร็จ");
      setMessage(
        `สร้าง QR แล้ว ${json.data.generated} รายการ` +
          (json.data.remainingHint ? " (ยังมีค้าง กดซ้ำได้)" : ""),
      );
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={onClick} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <QrCode className="h-4 w-4" />
        )}
        สร้าง QR ที่ยังไม่มี (สูงสุด 500/ครั้ง)
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
