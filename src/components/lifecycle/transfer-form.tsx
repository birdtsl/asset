"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; label: string };

export function TransferForm({
  assets,
  departments,
}: {
  assets: Option[];
  departments: Option[];
}) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [assetId, setAssetId] = useState(assets[0]?.id || "");
  const [toDepartmentId, setToDepartmentId] = useState("");
  const [toLocationText, setToLocationText] = useState("");
  const [transferDate, setTransferDate] = useState(today);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          toDepartmentId: toDepartmentId || null,
          toLocationText,
          transferDate,
          reason: reason || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      router.push(`/transfers/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>ครุภัณฑ์</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            required
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>หน่วยงานปลายทาง</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={toDepartmentId}
            onChange={(e) => setToDepartmentId(e.target.value)}
          >
            <option value="">-</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>วันที่โอน</Label>
          <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>สถานที่ตั้งปลายทาง</Label>
          <Input value={toLocationText} onChange={(e) => setToLocationText(e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>เหตุผล</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        บันทึกใบโอนย้าย
      </Button>
    </form>
  );
}
