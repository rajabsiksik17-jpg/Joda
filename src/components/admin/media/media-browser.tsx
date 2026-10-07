"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, FileVideo, ImageUp, LoaderCircle, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes, formatDateTime } from "@/lib/format";
import { deleteMedia, getMediaUsage, updateMediaMeta } from "@/app/admin/(panel)/media/actions";
import type { MediaUsage } from "@/lib/media/usage";
import { useAdminI18n } from "../i18n";
import { LocalizedInput } from "../fields/localized-input";
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, FieldShell, SearchInput, Select, Skeleton } from "../ui";

export type MediaItem = {
  id: string;
  url: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  alt: { ar?: string; en?: string };
  caption?: { ar?: string; en?: string } | null;
  isVideo: boolean;
  isSvg: boolean;
  originalName: string;
  size: number;
  createdAt: string;
};

type Upload = { id: string; name: string; progress: number; error?: string };

function uploadFile(url: string, file: File, onProgress: (p: number) => void): Promise<{ ok: boolean; item?: MediaItem; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { item?: MediaItem; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      resolve(xhr.status < 300 ? { ok: true, item: body.item } : { ok: false, error: body.error ?? (xhr.status === 413 ? "too_large" : "server") });
    };
    xhr.onerror = () => resolve({ ok: false, error: "network" });
    xhr.open("POST", url);
    xhr.send(fd);
  });
}

export function useUploadErrorText() {
  const { tx } = useAdminI18n();
  return (code?: string) =>
    ({
      unsupported_type: tx("Unsupported file type. Use JPG, PNG, WebP, AVIF, SVG, MP4 or WebM.", "نوع ملف غير مدعوم. استخدم JPG أو PNG أو WebP أو AVIF أو SVG أو MP4 أو WebM."),
      too_large: tx("File is too large (images 10 MB, SVG 1 MB, video 60 MB).", "الملف كبير جداً (الصور 10 ميغابايت، SVG ميغابايت واحد، الفيديو 60 ميغابايت)."),
      corrupt: tx("The image could not be read. It may be corrupted.", "تعذّرت قراءة الصورة. قد تكون تالفة."),
      unsafe_svg: tx("This SVG contains unsafe content (scripts or external references) and was rejected.", "يحتوي ملف SVG على محتوى غير آمن (نصوص برمجية أو مراجع خارجية) وتم رفضه."),
      rate_limited: tx("Too many uploads. Please wait a moment.", "عدد كبير من عمليات الرفع. يرجى الانتظار قليلاً."),
      forbidden: tx("You don't have permission to upload.", "ليست لديك صلاحية الرفع."),
      network: tx("Network error during upload.", "خطأ في الشبكة أثناء الرفع."),
    })[code ?? ""] ?? tx("Upload failed.", "فشل الرفع.");
}

/** Media library used both as the management page and as the picker inside editors. */
export function MediaBrowser({ mode, accept = "all", onPick, canManage = true, initialOpenId }: { mode: "manage" | "pick"; accept?: "all" | "image" | "video"; onPick?: (item: MediaItem) => void; canManage?: boolean; initialOpenId?: string }) {
  const { tx, locale } = useAdminI18n();
  const uploadError = useUploadErrorText();
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "image" | "video">(accept);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const openedInitial = useRef(false);

  const load = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/media?q=${encodeURIComponent(q)}&type=${type}&page=${p}`);
        const data = await res.json();
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setPage(data.page);
        setPages(data.pages);
        // Deep link (?open=<id>) opens the item once it has loaded.
        if (initialOpenId && !openedInitial.current) {
          const found = (data.items as MediaItem[]).find((i) => i.id === initialOpenId);
          if (found) {
            openedInitial.current = true;
            setSelected(found);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [q, type, initialOpenId],
  );

  useEffect(() => {
    const t = setTimeout(() => load(1, false), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);


  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 20);
    for (const file of list) {
      const id = `${file.name}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name, progress: 0 }]);
      const result = await uploadFile("/api/admin/media", file, (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))));
      if (result.ok && result.item) {
        setItems((prev) => [result.item!, ...prev]);
        setUploads((u) => u.filter((x) => x.id !== id));
        if (mode === "pick" && list.length === 1 && onPick) onPick(result.item);
      } else {
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: uploadError(result.error), progress: 100 } : x)));
      }
    }
  };

  return (
    <div
      onDragOver={(e) => {
        if (!canManage) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (canManage && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
      className="relative"
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-lg border-2 border-dashed border-tech bg-sky-50/90 text-tech-600">
          <div className="flex flex-col items-center gap-2 font-semibold"><UploadCloud className="size-8" />{tx("Drop files to upload", "أفلت الملفات للرفع")}</div>
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder={tx("Search by file name…", "ابحث باسم الملف…")} className="flex-1" />
        {accept === "all" && (
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="sm:w-40" aria-label={tx("File type", "نوع الملف")}>
            <option value="all">{tx("All files", "كل الملفات")}</option>
            <option value="image">{tx("Images", "الصور")}</option>
            <option value="video">{tx("Videos", "الفيديو")}</option>
          </Select>
        )}
        {canManage && (
          <>
            <input ref={fileRef} type="file" multiple accept={accept === "video" ? "video/mp4,video/webm" : accept === "image" ? "image/jpeg,image/png,image/webp,image/avif,image/svg+xml" : "image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm"} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            <Button variant="primary" onClick={() => fileRef.current?.click()}><ImageUp className="size-4" />{tx("Upload", "رفع")}</Button>
          </>
        )}
      </div>

      {uploads.length > 0 && (
        <ul className="mb-4 space-y-2">
          {uploads.map((u) => (
            <li key={u.id} className={cn("rounded-md border p-3 text-sm", u.error ? "border-red-200 bg-red-50" : "border-line bg-white")}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{u.name}</span>
                {u.error ? (
                  <button type="button" className="text-xs text-red-700 underline" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>{tx("Dismiss", "إغلاق")}</button>
                ) : (
                  <span className="text-xs text-muted" dir="ltr">{u.progress}%</span>
                )}
              </div>
              {u.error ? <p className="mt-1 text-xs text-red-700">{u.error}</p> : <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-tech-600 transition-all" style={{ width: `${u.progress}%` }} /></div>}
            </li>
          ))}
        </ul>
      )}

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ImageUp className="size-5" />}
          title={q ? tx("No files match your search", "لا توجد ملفات مطابقة") : tx("Your media library is empty", "مكتبة الوسائط فارغة")}
          text={canManage ? tx("Upload images (JPG, PNG, WebP, AVIF, SVG) or videos (MP4, WebM). Images are optimized automatically.", "ارفع صوراً (JPG و PNG و WebP و AVIF و SVG) أو فيديو (MP4 و WebM). يتم تحسين الصور تلقائياً.") : undefined}
          action={canManage ? <Button variant="primary" onClick={() => fileRef.current?.click()}><ImageUp className="size-4" />{tx("Upload files", "رفع ملفات")}</Button> : undefined}
        />
      ) : (
        <ul className={cn("grid gap-3", mode === "pick" ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6")}>
          {items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => (mode === "pick" ? onPick?.(m) : setSelected(m))}
                className="group block w-full overflow-hidden rounded-lg border border-line bg-white text-start transition-[border-color,box-shadow] hover:border-tech hover:shadow-soft focus-visible:border-tech"
              >
                <span className="relative block aspect-square bg-[repeating-conic-gradient(#f1f4f7_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
                  {m.isVideo ? (
                    <span className="absolute inset-0 grid place-items-center bg-navy text-white"><FileVideo className="size-8" /></span>
                  ) : (
                    <Image src={m.url} alt={m.alt?.[locale] || m.originalName} fill sizes="200px" className="object-contain p-1.5" unoptimized={m.isSvg} />
                  )}
                </span>
                <span className="block truncate px-2.5 py-2 text-xs text-ink">{m.originalName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {page < pages && (
        <div className="mt-6 flex justify-center">
          <Button loading={loading} onClick={() => load(page + 1, true)}>{tx("Load more", "تحميل المزيد")}</Button>
        </div>
      )}

      {mode === "manage" && selected && (
        <MediaDetails
          key={selected.id}
          item={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onChange={(m) => {
            setItems((prev) => prev.map((x) => (x.id === m.id ? m : x)));
            setSelected(m);
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((x) => x.id !== id));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function MediaDetails({ item, canManage, onClose, onChange, onDeleted }: { item: MediaItem; canManage: boolean; onClose: () => void; onChange: (m: MediaItem) => void; onDeleted: (id: string) => void }) {
  const { tx, locale } = useAdminI18n();
  const uploadError = useUploadErrorText();
  const [alt, setAlt] = useState(item.alt ?? {});
  const [caption, setCaption] = useState(item.caption ?? {});
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [copied, setCopied] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    getMediaUsage(item.id).then((r) => {
      if (alive && r.ok) setUsage(r.data ?? []);
    });
    return () => {
      alive = false;
    };
  }, [item.id]);

  const save = async () => {
    setSaving(true);
    const r = await updateMediaMeta(item.id, { alt, caption });
    setSaving(false);
    if (r.ok) {
      toast.success(tx("Details saved", "تم حفظ التفاصيل"));
      onChange({ ...item, alt, caption });
    } else toast.error(tx("Could not save", "تعذّر الحفظ"));
  };

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={item.originalName}
      width="lg"
      footer={
        canManage && (
          <>
            <Button variant="danger" className="me-auto" onClick={() => setConfirm(true)}><Trash2 className="size-4" />{tx("Delete", "حذف")}</Button>
            <Button onClick={onClose}>{tx("Close", "إغلاق")}</Button>
            <Button variant="primary" loading={saving} onClick={save}>{tx("Save details", "حفظ التفاصيل")}</Button>
          </>
        )
      }
    >
      <div className="relative mb-5 grid aspect-video place-items-center overflow-hidden rounded-lg border border-line bg-[repeating-conic-gradient(#f1f4f7_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
        {item.isVideo ? <video src={item.url} controls className="max-h-full max-w-full" /> : <Image src={item.url} alt={item.alt?.[locale] ?? ""} fill sizes="640px" className="object-contain p-2" unoptimized={item.isSvg} />}
      </div>
      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">{tx("Type", "النوع")}</dt><dd className="text-ink" dir="ltr">{item.mimeType}</dd>
        <dt className="text-muted">{tx("Size", "الحجم")}</dt><dd className="text-ink" dir="ltr">{formatBytes(item.size)}</dd>
        {item.width && <><dt className="text-muted">{tx("Dimensions", "الأبعاد")}</dt><dd className="text-ink" dir="ltr">{item.width} × {item.height}px</dd></>}
        <dt className="text-muted">{tx("Uploaded", "تاريخ الرفع")}</dt><dd className="text-ink">{formatDateTime(item.createdAt, locale)}</dd>
      </dl>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(location.origin + item.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{tx("Copy URL", "نسخ الرابط")}
        </Button>
        {canManage && (
          <>
            <input
              ref={replaceRef}
              type="file"
              className="hidden"
              accept={item.isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif,image/svg+xml"}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setReplacing(true);
                const r = await uploadFile(`/api/admin/media/${item.id}/replace`, file, () => undefined);
                setReplacing(false);
                if (r.ok && r.item) {
                  toast.success(tx("File replaced everywhere it is used", "تم استبدال الملف في جميع أماكن استخدامه"));
                  onChange({ ...r.item, alt, caption });
                } else toast.error(uploadError(r.error));
              }}
            />
            <Button size="sm" loading={replacing} onClick={() => replaceRef.current?.click()}><RefreshCw className="size-3.5" />{tx("Replace file", "استبدال الملف")}</Button>
          </>
        )}
      </div>
      {!item.isVideo && (
        <FieldShell label={tx("Alternative text (describes the image for screen readers and SEO)", "النص البديل (يصف الصورة لقارئات الشاشة ومحركات البحث)")} className="mb-4">
          <LocalizedInput id="media-alt" value={alt} onChange={setAlt} max={300} />
        </FieldShell>
      )}
      <FieldShell label={tx("Caption (optional)", "تعليق (اختياري)")} className="mb-6">
        <LocalizedInput id="media-caption" value={caption ?? {}} onChange={setCaption} max={500} />
      </FieldShell>
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">{tx("Used in", "مستخدم في")}</p>
        {usage === null ? (
          <p className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-3.5 animate-spin" />{tx("Checking…", "جارٍ التحقق…")}</p>
        ) : usage.length === 0 ? (
          <p className="text-sm text-muted">{tx("Not used anywhere yet.", "غير مستخدم في أي مكان بعد.")}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">{usage.map((u, i) => <li key={i}><a href={u.href}><Badge tone="info">{u.kind} · {u.label}</Badge></a></li>)}</ul>
        )}
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={tx("Delete this file?", "حذف هذا الملف؟")}
        description={usage?.length ? tx(`This file is used in ${usage.length} place(s). Those places will show no image after deletion.`, `هذا الملف مستخدم في ${usage.length} موضع. لن تظهر الصورة في تلك المواضع بعد الحذف.`) : undefined}
        onConfirm={async () => {
          const r = await deleteMedia(item.id);
          if (r.ok) {
            toast.success(tx("File deleted", "تم حذف الملف"));
            onDeleted(item.id);
          } else toast.error(tx("Could not delete", "تعذّر الحذف"));
        }}
      />
    </Drawer>
  );
}
