"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AssistantPanel } from "@/components/assistant/assistant-panel";

type HeaderProps = {
  fullName: string;
  username: string;
  roles: string[];
  departmentName?: string | null;
};

export function Header({
  fullName,
  username,
  roles,
  departmentName,
}: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-800">ระบบบริหารทรัพย์สิน</p>
        <p className="text-xs text-slate-500">Thung Saliam Hospital</p>
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
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </header>
  );
}
