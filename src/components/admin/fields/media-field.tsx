"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FileVideo, ImagePlus, RefreshCw, X } from "lucide-react";
import { useAdminI18n } from "../i18n";
import { MediaBrowser, type MediaItem } from "../media/media-browser";
import { Button, Modal } from "../ui";

const cache = new Map<string, MediaItem | null>();

export function useMediaItem(id: string | null | undefined) {
  const [fetched, setFetched] = useState<{ id: string; item: MediaItem | null } | null>(null);
  useEffect(() => {
    if (!id || cache.has(id)) return;
    let alive = true;
    fetch(`/api/admin/media/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        cache.set(id, d?.item ?? null);
        if (alive) setFetched({ id, item: d?.item ?? null });
      });
    return () => {
      alive = false;
    };
  }, [id]);
  if (!id) return null;
  if (cache.has(id)) return cache.get(id) ?? null;
  return fetched?.id === id ? fetched.item : null;
}

export function MediaField({ value, onChange, accept = "image", id }: { value: string | null | undefined; onChange: (v: string | null) => void; accept?: "image" | "video"; id?: string }) {
  const { tx, locale } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const item = useMediaItem(value);

  return (
    <div id={id}>
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-line-strong bg-white p-2">
          <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded bg-[repeating-conic-gradient(#f1f4f7_0_25%,#fff_0_50%)] bg-[length:12px_12px]">
            {item?.isVideo ? <FileVideo className="size-6 text-tech-600" /> : item ? <Image src={item.url} alt={item.alt?.[locale] ?? ""} fill sizes="64px" className="object-contain" unoptimized={item.isSvg} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{item?.originalName ?? tx("Loading…", "جارٍ التحميل…")}</span>
            {item?.width && <span className="block text-xs text-muted" dir="ltr">{item.width} × {item.height}</span>}
          </span>
          <Button size="sm" type="button" onClick={() => setOpen(true)}><RefreshCw className="size-3.5" />{tx("Change", "تغيير")}</Button>
          <Button size="icon" type="button" variant="ghost" onClick={() => onChange(null)} aria-label={tx("Remove", "إزالة")}><X className="size-4" /></Button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-white px-4 py-5 text-sm font-medium text-muted transition-colors hover:border-tech hover:text-tech-600">
          <ImagePlus className="size-4" />
          {accept === "video" ? tx("Choose or upload a video", "اختر أو ارفع فيديو") : tx("Choose or upload an image", "اختر أو ارفع صورة")}
        </button>
      )}
      <Modal open={open} onOpenChange={setOpen} title={tx("Media library", "مكتبة الوسائط")} size="xl">
        {open && (
          <MediaBrowser
            mode="pick"
            accept={accept}
            onPick={(m) => {
              cache.set(m.id, m);
              onChange(m.id);
              setOpen(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
