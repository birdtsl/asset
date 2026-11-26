"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImportActions({
  batchId,
  status,
  canCommit,
}: {
  batchId: string;
  status: string;
  canCommit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"validate" | "commit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "validate" | "commit") {
    setLoading(action);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/imports/${batchId}/${action}`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ดำเนินการไม่สำเร็จ");
      setMessage(
        action === "validate"
          ? "ตรวจสอบข้อมูลเรียบร้อย"
          : `นำเข้าสำเร็จ ${json.data.committedRows} รายการ`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(null);
    }
  }

  if (status === "COMMITTED") {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        ชุดนี้ถูกนำเข้าเรียบร้อยแล้ว
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => run("validate")}
          disabled={!!loading}
        >
          {loading === "validate" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          ตรวจสอบข้อมูล
        </Button>
        <Button
          onClick={() => run("commit")}
          disabled={!!loading || !canCommit}
        >
          {loading === "commit" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          ยืนยันนำเข้าทะเบียน
        </Button>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
    </div>
  );
}
