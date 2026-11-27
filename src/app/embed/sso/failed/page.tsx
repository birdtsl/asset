"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const REASONS: Record<string, string> = {
  missing_token: "ไม่พบ token จาก TSL MIS",
  invalid_or_mismatched_secret:
    "token ไม่ถูกต้อง หรือ SMART_ASSET_SSO_SECRET ไม่ตรงกับ TSL MIS — ใส่ค่าเดียวกันใน .env ทั้งสองโปรเจกต์แล้วรีสตาร์ท Smart Asset",
  missing_auth_secret: "Smart Asset ยังไม่ได้ตั้ง AUTH_SECRET ใน .env",
  user_provision_failed:
    "สร้าง/โหลดผู้ใช้ไม่สำเร็จ — ตรวจว่ามีบทบาท VIEWER ในฐานข้อมูล tsl_asset",
};

function FailedBody() {
  const params = useSearchParams();
  const reason = params.get("reason") || "unknown";
  const message = REASONS[reason] || `เข้าสู่ระบบอัตโนมัติไม่สำเร็จ (${reason})`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-rose-800">{message}</p>
        <a href="/" className="mt-3 inline-block text-xs font-medium text-teal-800 underline">
          ไปหน้า login ปกติ
        </a>
      </div>
    </div>
  );
}

export default function EmbedSsoFailedPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-600">กำลังโหลด…</div>}>
      <FailedBody />
    </Suspense>
  );
}
