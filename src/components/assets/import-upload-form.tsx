"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportUploadForm({
  defaultAssetClass = "NORMAL",
}: {
  defaultAssetClass?: "NORMAL" | "LOW_VALUE";
}) {
  const router = useRouter();
  const [assetClass, setAssetClass] = useState<"NORMAL" | "LOW_VALUE">(
    defaultAssetClass,
  );
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("assetClass", assetClass);
      const res = await fetch("/api/imports", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "อัปโหลดไม่สำเร็จ");
      router.push(`/assets/import/${json.data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="space-y-2">
        <Label htmlFor="assetClass">ประเภททะเบียน</Label>
        <select
          id="assetClass"
          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={assetClass}
          onChange={(e) => setAssetClass(e.target.value as "NORMAL" | "LOW_VALUE")}
        >
          <option value="NORMAL">ครุภัณฑ์ (ปกติ)</option>
          <option value="LOW_VALUE">ครุภัณฑ์ต่ำกว่าเกณฑ์</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">ไฟล์ Excel (.xlsx / .xlsm)</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx,.xlsm,.xls"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังอัปโหลดและจัด staging...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            อัปโหลดเพื่อ Preview
          </>
        )}
      </Button>
    </form>
  );
}
