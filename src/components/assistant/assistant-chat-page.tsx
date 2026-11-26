"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "สรุปจำนวนครุภัณฑ์",
  "วิธีสร้าง QR Code",
  "วิธีตรวจประจำปี",
  "วิธีรับเข้าวัสดุ",
  "สต็อกต่ำกี่รายการ",
];

export function AssistantChatPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "ถามได้เลย เช่น สรุปตัวเลข, วิธีนำเข้า Excel, หรือค้นหาด้วยรหัสครุภัณฑ์",
    },
  ]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.ok ? json.data.answer : json.error || "ตอบไม่สำเร็จ",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "เชื่อมต่อผู้ช่วยไม่สำเร็จ" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => ask(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="h-[420px] space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-12 bg-teal-700 text-white"
                : "mr-12 bg-slate-100 text-slate-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" /> กำลังประมวลผล...
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask(input);
          }}
          placeholder="พิมพ์คำถาม..."
          className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        <Button type="button" onClick={() => ask(input)} disabled={loading}>
          <Send className="h-4 w-4" />
          ส่ง
        </Button>
      </div>
    </div>
  );
}
