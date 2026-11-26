"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CampaignForm() {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultYear = useMemo(() => {
    const y = Number(
      new Date().toLocaleString("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
      }),
    );
    return y + 543;
  }, []);

  const [yearBe, setYearBe] = useState(String(defaultYear));
  const [title, setTitle] = useState(`ตรวจประจำปี ${defaultYear}`);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");
  const [includeLowValue, setIncludeLowValue] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inspection/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearBe: Number(yearBe),
          title,
          startDate,
          endDate: endDate || null,
          includeLowValue,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "สร้างรอบตรวจไม่สำเร็จ");
      router.push(`/inspection/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>ปีงบประมาณ (พ.ศ.)</Label>
          <Input
            type="number"
            value={yearBe}
            onChange={(e) => setYearBe(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>ชื่อรอบตรวจ</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>วันเริ่ม</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>วันสิ้นสุด (ถ้ามี)</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeLowValue}
              onChange={(e) => setIncludeLowValue(e.target.checked)}
            />
            รวมครุภัณฑ์ต่ำกว่าเกณฑ์
          </label>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>หมายเหตุ</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        สร้างรอบตรวจและโหลดรายการครุภัณฑ์
      </Button>
    </form>
  );
}
