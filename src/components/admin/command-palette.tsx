"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { CornerDownLeft, FileText, Image as ImageIcon, Inbox, Layers, LoaderCircle, Newspaper, Search, UserCog } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "./i18n";

type Hit = { kind: "page" | "service" | "post" | "message" | "media" | "user"; title: string; subtitle: string; href: string };
const KIND_ICON = { page: FileText, service: Layers, post: Newspaper, message: Inbox, media: ImageIcon, user: UserCog };

/** Global admin search (Ctrl/⌘ + K) across content, messages, media and users. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tx } = useAdminI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        if (res.ok) {
          setHits((await res.json()).hits);
          setActive(0);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const shown = q.trim().length < 2 ? [] : hits;
  const go = (h: Hit) => {
    onOpenChange(false);
    setQ("");
    router.push(h.href);
  };
  const kindLabel = { page: tx("Page", "صفحة"), service: tx("Service", "خدمة"), post: tx("Insight", "مقال"), message: tx("Message", "رسالة"), media: tx("Media", "وسائط"), user: tx("User", "مستخدم") };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) setQ(""); onOpenChange(o); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-navy/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-[12vh] left-1/2 z-[70] w-[calc(100vw-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl bg-white shadow-2xl focus:outline-none">
          <Dialog.Title className="sr-only">{tx("Search", "بحث")}</Dialog.Title>
          <Dialog.Description className="sr-only">{tx("Search across the CMS", "البحث في نظام إدارة المحتوى")}</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            {loading ? <LoaderCircle className="size-5 animate-spin text-muted" /> : <Search className="size-5 text-muted" aria-hidden />}
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter" && shown[active]) go(shown[active]);
              }}
              placeholder={tx("Search pages, services, insights, messages…", "ابحث في الصفحات والخدمات والمقالات والرسائل…")}
              className="h-14 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
              role="combobox"
              aria-expanded={shown.length > 0}
              aria-controls="cmdk-list"
              aria-activedescendant={shown[active] ? `cmdk-${active}` : undefined}
            />
          </div>
          <ul id="cmdk-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {q.trim().length >= 2 && !loading && shown.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{tx("No results", "لا توجد نتائج")}</li>}
            {q.trim().length < 2 && <li className="px-3 py-8 text-center text-sm text-muted">{tx("Type at least 2 characters", "اكتب حرفين على الأقل")}</li>}
            {shown.map((h, i) => {
              const Icon = KIND_ICON[h.kind];
              return (
                <li key={`${h.kind}-${h.href}`} id={`cmdk-${i}`} role="option" aria-selected={i === active}>
                  <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(h)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start", i === active ? "bg-sky-50" : "")}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface text-tech-600"><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{h.title}</span>
                      <span className="block truncate text-xs text-muted">{kindLabel[h.kind]} · {h.subtitle}</span>
                    </span>
                    {i === active && <CornerDownLeft className="size-4 text-muted rtl:-scale-x-100" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
