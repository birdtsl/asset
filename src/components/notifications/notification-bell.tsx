"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Noti = {
  id: string;
  title: string;
  message: string;
  severity: string;
  href: string | null;
  isRead: boolean;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (res.ok) {
        setItems(json.data.items);
        setUnread(json.data.unread);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH" });
    await load();
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await load();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <Badge variant="warning" className="ml-1">
            {unread}
          </Badge>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">การแจ้งเตือน</p>
            <button
              type="button"
              className="text-xs text-teal-700 hover:underline"
              onClick={markAll}
            >
              อ่านทั้งหมด
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                ไม่มีการแจ้งเตือน
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-slate-50 px-3 py-2 ${
                    n.isRead ? "bg-white" : "bg-teal-50/40"
                  }`}
                >
                  {n.href ? (
                    <Link
                      href={n.href}
                      className="block text-sm font-medium text-teal-800 hover:underline"
                      onClick={() => markOne(n.id)}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-100 px-3 py-2 text-right">
            <Link
              href="/notifications"
              className="text-xs text-teal-700 hover:underline"
              onClick={() => setOpen(false)}
            >
              ดูทั้งหมด
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
