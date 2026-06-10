"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Item {
  id: string;
  name: string;
  amount: number;
  type: string;
  category: string;
  color: string;
  due_date: string | null;
  autopay: boolean;
  status: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_MAP: Record<string,number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDayFromDue(due: string, targetMonth: number, targetYear: number): number | null {
  // "Apr 30" style
  const parts = due.trim().split(" ");
  if (parts.length === 2) {
    const mo = MONTH_MAP[parts[0]];
    const d  = parseInt(parts[1]);
    if (!isNaN(d)) {
      // If month matches return day; if no month given (numeric only) always show
      if (mo === targetMonth) return d;
      if (mo === undefined) return d; // bare number
    }
  }
  // bare number "15"
  const n = parseInt(due);
  if (!isNaN(n) && due.trim().match(/^\d+$/)) return n;
  // ISO date
  const iso = new Date(due);
  if (!isNaN(iso.getTime()) && iso.getMonth() === targetMonth && iso.getFullYear() === targetYear) return iso.getDate();
  // No month specified  -  show every month
  const bare = due.match(/\b(\d{1,2})$/);
  if (bare) return parseInt(bare[1]);
  return null;
}

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClient();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.id)
        .neq("type", "expense");
      if (data) setItems(data as Item[]);
      setLoading(false);
    }
    load();
  }, []);

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  // Build dueDays map: day number → items
  const dueDays: Record<number, Item[]> = {};
  items.forEach(item => {
    if (!item.due_date) return;
    const d = parseDayFromDue(item.due_date, month, year);
    if (d && d >= 1 && d <= 31) {
      if (!dueDays[d]) dueDays[d] = [];
      dueDays[d].push(item);
    }
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDue    = Object.values(dueDays).flat().reduce((a, b) => a + b.amount, 0);
  const selectedItems = dueDays[selectedDay] || [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bill Calendar</h1>
        <p className="mt-1 text-sm text-gray-400">All upcoming due dates at a glance.</p>
      </div>

      {/* Month navigator */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prev} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold">{MONTHS[month]} {year}</p>
          <p className="text-xs text-gray-500">{fmt(totalDue)} due this month</p>
        </div>
        <button onClick={next} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map(d => (
            <div key={d} className="py-1 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const hasItems = (dueDays[d]?.length ?? 0) > 0;
            const isToday  = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const isSel    = d === selectedDay;
            const dayTotal = dueDays[d]?.reduce((a, b) => a + b.amount, 0) ?? 0;

            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition"
                style={{
                  background: isSel ? "#3EA758" : isToday ? "#3EA75820" : hasItems ? "#3EA75808" : "transparent",
                  border: isSel ? "2px solid #3EA758" : hasItems ? "1px solid #3EA75830" : "1px solid rgba(255,255,255,0.04)",
                  fontWeight: isSel || isToday ? 700 : 400,
                  color: isSel ? "#000" : isToday ? "#3EA758" : "white",
                }}
              >
                {d}
                {hasItems && !isSel && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand" />
                )}
                {hasItems && isSel && (
                  <span className="text-[8px] font-bold text-black/70">${Math.round(dayTotal)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-bold">
          {selectedItems.length > 0
            ? `Due on ${MONTHS[month].slice(0, 3)} ${selectedDay}`
            : `Nothing due on ${MONTHS[month].slice(0, 3)} ${selectedDay}`}
        </p>
        {selectedItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-8 text-center">
            <p className="text-sm text-gray-500">No bills due on this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-black"
                  style={{ background: item.color || "#3EA758" }}
                >
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.category}
                    {item.autopay ? " · Autopay" : " · Manual pay"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{fmt(item.amount)}</p>
                  {item.status === "urgent" && <p className="text-xs font-semibold text-red-400">Urgent</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All due this month */}
      {Object.keys(dueDays).length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">All Due This Month</p>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {Object.entries(dueDays)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .flatMap(([day, dayItems]) =>
                dayItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 border-b border-white/5 px-5 py-3.5 last:border-0 hover:bg-white/[0.02]"
                    onClick={() => setSelectedDay(parseInt(day))}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-black"
                      style={{ background: item.color || "#3EA758" }}
                    >
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold">{fmt(item.amount)}</p>
                      <p className="text-xs text-gray-500">{MONTHS[month].slice(0, 3)} {day}</p>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-gray-400">No items with due dates yet.</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90">
            Add items in Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
