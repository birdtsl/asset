"use client";

import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import {
  getMisDirectorWarehouseUrl,
  MIS_FROM_COOKIE,
  MIS_RETURN_COOKIE,
  sanitizeMisReturnUrl,
} from "@/lib/mis-origin";

type HeaderProps = {
  fullName: string;
  username: string;
  roles: string[];
  departmentName?: string | null;
  /** เข้ามาจากแท็บทรัพยากรคลังของ TSL MIS */
  fromMis?: boolean;
  /** URL กลับไปตัวชี้วัดผู้อำนวยการ (จาก cookie ตอน SSO) */
  misReturnUrl?: string | null;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const hit = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!hit) return null;
  return decodeURIComponent(hit.slice(name.length + 1));
}

export function Header({
  fullName,
  username,
  roles,
  departmentName,
  fromMis = false,
  misReturnUrl = null,
}: HeaderProps) {
  const [showMisReturn, setShowMisReturn] = useState(fromMis || Boolean(misReturnUrl));
  const [returnHref, setReturnHref] = useState(
    () => sanitizeMisReturnUrl(misReturnUrl) || getMisDirectorWarehouseUrl(),
  );

  useEffect(() => {
    const fromCookie = readCookie(MIS_FROM_COOKIE) === "1";
    const urlCookie = sanitizeMisReturnUrl(readCookie(MIS_RETURN_COOKIE));
    if (fromMis || fromCookie || urlCookie) setShowMisReturn(true);
    if (urlCookie) setReturnHref(urlCookie);
    else if (misReturnUrl) {
      const cleaned = sanitizeMisReturnUrl(misReturnUrl);
      if (cleaned) setReturnHref(cleaned);
    }
  }, [fromMis, misReturnUrl]);

  const goBackToMis = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const targetUrl = returnHref;

    try {
      const opener = window.opener as Window | null;
      if (opener && !opener.closed) {
        // เปิดจาก iframe ทรัพยากรคลัง → กลับไปหน้าต่างหลักของ TSL MIS
        const topWin = opener.top ?? opener;
        try {
          topWin.focus();
          topWin.location.href = targetUrl;
        } catch {
          try {
            opener.location.href = targetUrl;
          } catch {
            /* fall through */
          }
        }
        window.close();
        window.setTimeout(() => {
          window.location.href = targetUrl;
        }, 200);
        return;
      }
    } catch {
      /* cross-origin — navigate ในแท็บนี้ */
    }

    window.location.href = targetUrl;
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        {showMisReturn ? (
          <a
            href={returnHref}
            onClick={goBackToMis}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 no-underline transition hover:bg-teal-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับตัวชี้วัดผู้อำนวยการ
          </a>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">ระบบบริหารทรัพย์สิน</p>
          <p className="text-xs text-slate-500">Thung Saliam Hospital</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AssistantPanel />
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-800">{fullName}</p>
          <p className="text-xs text-slate-500">
            {username}
            {departmentName ? ` · ${departmentName}` : ""}
          </p>
        </div>
        <div className="hidden gap-1 md:flex">
          {roles.slice(0, 2).map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-800">
          <User className="h-4 w-4" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </header>
  );
}
