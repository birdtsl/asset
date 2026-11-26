"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InspectForm({
  itemId,
  defaultResult = "PASS",
  defaultLocation = "",
  defaultNote = "",
}: {
  itemId: string;
  defaultResult?: string;
  defaultLocation?: string;
  defaultNote?: string;
}) {
  const router = useRouter();
  const [result, setResult] = useState(defaultResult);
  const [locationFound, setLocationFound] = useState(defaultLocation);
  const [conditionNote, setConditionNote] = useState(defaultNote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/inspection/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          locationFound: locationFound || null,
          conditionNote: conditionNote || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกผลการตรวจไม่สำเร็จ");
      setOk("บันทึกผลการตรวจแล้ว");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label>ผลการตรวจ</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          >
            <option value="PASS">พบ/ใช้งานได้</option>
            <option value="REPAIR_NEEDED">ต้องซ่อม</option>
            <option value="FAIL">ชำรุด</option>
            <option value="MISSING">ไม่พบ</option>
            <option value="DISPOSED">จำหน่ายแล้ว</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>สถานที่พบ</Label>
          <Input
            value={locationFound}
            onChange={(e) => setLocationFound(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>หมายเหตุสภาพ</Label>
          <Input
            value={conditionNote}
            onChange={(e) => setConditionNote(e.target.value)}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        บันทึกผลตรวจ
      </Button>
    </form>
  );
}
