"use client";

import { useEffect } from "react";

/** ส่งต่อไปยัง Route Handler ที่ตั้ง session ฝั่งเซิร์ฟเวอร์ (เสถียรใน iframe) */
export default function EmbedSsoRedirectPage() {
  useEffect(() => {
    const q = window.location.search || "";
    window.location.replace(`/embed/sso/enter${q}`);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      <p className="text-sm font-medium text-slate-700">กำลังเข้าสู่ Smart Asset จาก TSL MIS…</p>
    </div>
  );
}
