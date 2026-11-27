"use client";

import { signOut } from "next-auth/react";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import {
  getMisDirectorWarehouseUrl,
  MIS_FROM_COOKIE,
} from "@/lib/mis-origin";

type HeaderProps = {
  fullName: string;
  username: string;
  roles: string[];
  departmentName?: string | null;
  /** เข้ามาจากแท็บทรัพยากรคลังของ TSL MIS */
  fromMis?: boolean;
};

function hasMisCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${MIS_FROM_COOKIE}=`));
}

export function Header({
  fullName,
  username,
  roles,
  departmentName,
  fromMis = false,
}: HeaderProps) {
  const [showMisReturn, setShowMisReturn] = useState(fromMis);
  const misUrl = useMemo(() => getMisDirectorWarehouseUrl(), []);

  useEffect(() => {
    if (fromMis || hasMisCookie()) setShowMisReturn(true);
  }, [fromMis]);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        {showMisReturn ? (
          <a
            href={misUrl}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 no-underline transition hover:bg-teal-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            กลับหน้า Dashboard หลัก
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
