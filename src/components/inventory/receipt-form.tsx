"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; label: string };

type Line = {
  materialId: string;
  quantity: string;
  unitCost: string;
  notes: string;
};

export function ReceiptForm({
  warehouses,
  materials,
  suppliers,
  departments,
}: {
  warehouses: Option[];
  materials: Option[];
  suppliers: Option[];
  departments: Option[];
}) {
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [receiptDate, setReceiptDate] = useState(today);
  const [supplierId, setSupplierId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [refNo, setRefNo] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { materialId: materials[0]?.id || "", quantity: "1", unitCost: "0", notes: "" },
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
      const res = await fetch("/api/inventory/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId,
          receiptDate,
          supplierId: supplierId || null,
          departmentId: departmentId || null,
          refNo: refNo || null,
          notes: notes || null,
          items: lines.map((l) => ({
            materialId: l.materialId,
            quantity: Number(l.quantity),
            unitCost: Number(l.unitCost || 0),
            notes: l.notes || null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      router.push(`/inventory/receipts/${json.data.id}`);
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
          <Label>วันที่รับเข้า</Label>
          <Input
            type="date"
            value={receiptDate}
            onChange={(e) => setReceiptDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>ผู้จำหน่าย</Label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">-</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>หน่วยงาน</Label>
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
          <Label>เลขที่อ้างอิง</Label>
          <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} />
        </div>
        <div className="space-y-2">
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
                {
                  materialId: materials[0]?.id || "",
                  quantity: "1",
                  unitCost: "0",
                  notes: "",
                },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </div>
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-md border border-slate-100 p-3 md:grid-cols-12"
          >
            <div className="md:col-span-5">
              <select
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                value={line.materialId}
                onChange={(e) => updateLine(index, { materialId: e.target.value })}
                required
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
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
            </div>
            <div className="md:col-span-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.unitCost}
                onChange={(e) => updateLine(index, { unitCost: e.target.value })}
                placeholder="ราคา/หน่วย"
              />
            </div>
            <div className="md:col-span-2">
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
        ))}
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        บันทึกใบรับเข้า (DRAFT)
      </Button>
    </form>
  );
}
