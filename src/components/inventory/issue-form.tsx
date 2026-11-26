"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; label: string; onHand?: number };

type Line = {
  materialId: string;
  quantity: string;
  notes: string;
};

export function IssueForm({
  warehouses,
  materials,
  departments,
}: {
  warehouses: Option[];
  materials: Option[];
  departments: Option[];
}) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [issueDate, setIssueDate] = useState(today);
  const [departmentId, setDepartmentId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { materialId: materials[0]?.id || "", quantity: "1", notes: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId,
          issueDate,
          departmentId: departmentId || null,
          requestedBy: requestedBy || null,
          purpose: purpose || null,
          notes: notes || null,
          items: lines.map((l) => ({
            materialId: l.materialId,
            quantity: Number(l.quantity),
            notes: l.notes || null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      router.push(`/inventory/issues/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>คลัง</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            required
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>วันที่จ่ายออก</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>หน่วยงานผู้เบิก</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
          <Label>ผู้ขอเบิก</Label>
          <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>วัตถุประสงค์</Label>
          <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>หมายเหตุ</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">รายการวัสดุ</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { materialId: materials[0]?.id || "", quantity: "1", notes: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </div>
        {lines.map((line, index) => {
          const mat = materials.find((m) => m.id === line.materialId);
          return (
            <div
              key={index}
              className="grid gap-2 rounded-md border border-slate-100 p-3 md:grid-cols-12"
            >
              <div className="md:col-span-6">
                <select
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  value={line.materialId}
                  onChange={(e) => updateLine(index, { materialId: e.target.value })}
                  required
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                      {typeof m.onHand === "number"
                        ? ` (คงเหลือ ${m.onHand})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  required
                  placeholder="จำนวน"
                />
                {mat?.onHand != null ? (
                  <p className="mt-1 text-xs text-slate-500">
                    คงเหลือ {mat.onHand.toLocaleString("th-TH")}
                  </p>
                ) : null}
              </div>
              <div className="md:col-span-3">
                <Input
                  value={line.notes}
                  onChange={(e) => updateLine(index, { notes: e.target.value })}
                  placeholder="หมายเหตุ"
                />
              </div>
              <div className="md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        บันทึกใบจ่ายออก (DRAFT)
      </Button>
    </form>
  );
}
