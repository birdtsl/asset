"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; label: string };

export function MaintenanceForm({
  assets,
  lands,
}: {
  assets: Option[];
  lands: Option[];
}) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [targetType, setTargetType] = useState<"asset" | "land">("asset");
  const [assetId, setAssetId] = useState(assets[0]?.id || "");
  const [landId, setLandId] = useState(lands[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestDate, setRequestDate] = useState(today);
  const [cost, setCost] = useState("0");
  const [vendorName, setVendorName] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: targetType === "asset" ? assetId : null,
          landId: targetType === "land" ? landId : null,
          title,
          description: description || null,
          requestDate,
          cost: Number(cost || 0),
          vendorName: vendorName || null,
          requestedBy: requestedBy || null,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      router.push(`/maintenance/${json.data.id}`);
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
          <Label>ประเภทเป้าหมาย</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as "asset" | "land")}
          >
            <option value="asset">ครุภัณฑ์</option>
            <option value="land">ที่ดิน</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>{targetType === "asset" ? "ครุภัณฑ์" : "ที่ดิน"}</Label>
          {targetType === "asset" ? (
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
          ) : (
            <select
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              value={landId}
              onChange={(e) => setLandId(e.target.value)}
              required
            >
              {lands.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>หัวข้องาน</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>วันที่แจ้งซ่อม</Label>
          <Input type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>ค่าใช้จ่าย</Label>
          <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>ผู้รับจ้าง/ร้านซ่อม</Label>
          <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>ผู้แจ้ง</Label>
          <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>รายละเอียด</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>หมายเหตุ</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        บันทึกใบซ่อมบำรุง
      </Button>
    </form>
  );
}
