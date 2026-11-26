"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function EmbedSsoClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token")?.trim() || "";
    const nextRaw = params.get("next")?.trim() || "/dashboard";
    const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";

    if (!token) {
      setError("ไม่พบ token สำหรับเข้าสู่ระบบอัตโนมัติ");
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await signIn("embed-sso", {
        token,
        redirect: false,
        callbackUrl: next,
      });
      if (cancelled) return;
      if (result?.error) {
        setError("เข้าสู่ระบบอัตโนมัติไม่สำเร็จ — ตรวจ SMART_ASSET_SSO_SECRET ให้ตรงกับ TSL MIS");
        return;
      }
      router.replace(next);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
          <a href="/login" className="mt-3 inline-block text-xs font-medium text-teal-800 underline">
            ไปหน้า login ปกติ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      <p className="text-sm font-medium text-slate-700">กำลังเข้าสู่ Smart Asset จาก TSL MIS…</p>
    </div>
  );
}

export default function EmbedSsoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
          กำลังเตรียมเข้าสู่ระบบ…
        </div>
      }
    >
      <EmbedSsoClient />
    </Suspense>
  );
}
