"use client";

import { useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; text: string };

export function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "สวัสดี ฉันช่วยตอบคำถามการใช้งาน TSL Smart Asset และสรุปตัวเลขจากฐานข้อมูลจริงได้",
    },
  ]);

  async function send() {
    const q = input.trim();
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
      const answer = res.ok
        ? json.data.answer
        : json.error || "ตอบคำถามไม่สำเร็จ";
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
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
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Bot className="h-4 w-4" />
        ผู้ช่วย
      </Button>

      {open ? (
        <div className="fixed bottom-4 right-4 z-50 flex h-[420px] w-[360px] flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">AI Assistant</p>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-800"
              onClick={() => setOpen(false)}
            >
              ปิด
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-8 bg-teal-700 text-white"
                    : "mr-6 bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> กำลังคิด...
              </div>
            ) : null}
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="ถาม เช่น สรุปจำนวนครุภัณฑ์"
              className="h-9 flex-1 rounded-md border border-slate-300 px-2 text-sm"
            />
            <Button type="button" size="sm" onClick={send} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
