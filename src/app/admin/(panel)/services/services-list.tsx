"use client";

import Link from "next/link";
import { useState, useTransition, useId } from "react";
import { toast } from "sonner";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers } from "lucide-react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "@/components/admin/i18n";
import { actionErrorText } from "@/components/admin/fields/env";
import { Badge, EmptyState, Switch } from "@/components/admin/ui";
import { reorderServices, setServiceStatus } from "./actions";

type Row = { id: string; slug: string; title: string; icon: string; category: string; published: boolean; featured: boolean; missingEn: boolean; missingAr: boolean };

export function ServicesList({ services }: { services: Row[] }) {
  const { tx } = useAdminI18n();
  const [rows, setRows] = useState(services);
  const [, start] = useTransition();
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  if (rows.length === 0) return <EmptyState icon={<Layers className="size-5" />} title={tx("No services yet", "لا توجد خدمات بعد")} text={tx("Create your first service to show it on the website.", "أنشئ أول خدمة لعرضها على الموقع.")} />;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(rows, rows.findIndex((r) => r.id === e.active.id), rows.findIndex((r) => r.id === e.over!.id));
    setRows(next);
    start(async () => {
      const r = await reorderServices(next.map((x) => x.id));
      if (!r.ok) toast.error(actionErrorText(r.error, tx));
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-line">
              {rows.map((r, i) => (
                <Item
                  key={r.id}
                  row={r}
                  index={i}
                  onToggle={async (v) => {
                    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: v } : x)));
                    const res = await setServiceStatus(r.id, v);
                    if (!res.ok) {
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: !v } : x)));
                      toast.error(actionErrorText(res.error, tx));
                    }
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <p className="mt-2 text-xs text-muted">{tx("Drag to reorder. The order controls numbering and menus on the website.", "اسحب لإعادة الترتيب. يحدد الترتيب الترقيم والقوائم في الموقع.")}</p>
    </>
  );
}

function Item({ row, index, onToggle }: { row: Row; index: number; onToggle: (v: boolean) => void }) {
  const { tx } = useAdminI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("flex items-center gap-3 bg-white px-3 py-2.5", isDragging && "relative z-10 shadow-lift")}>
      <button type="button" className="grid size-8 cursor-grab touch-none place-items-center rounded text-muted hover:bg-surface" aria-label={tx("Drag to reorder", "اسحب لإعادة الترتيب")} {...attributes} {...listeners}><GripVertical className="size-4" /></button>
      <span className="w-6 font-mono text-xs text-mist" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sky-50 text-tech-600"><Icon name={row.icon} className="size-4" /></span>
      <Link href={`/admin/services/${row.id}`} className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink hover:text-tech-600">{row.title}</span>
        <span className="block truncate text-xs text-muted">{row.category || tx("No category", "بدون فئة")} · <span dir="ltr">/services/{row.slug}</span></span>
      </Link>
      {row.featured && <Badge tone="info">{tx("Featured", "مميزة")}</Badge>}
      {(row.missingAr || row.missingEn) && <Badge tone="warning">{row.missingAr ? tx("Arabic missing", "العربية ناقصة") : tx("English missing", "الإنجليزية ناقصة")}</Badge>}
      <span className="hidden items-center gap-2 sm:flex">
        <span className="text-xs text-muted">{row.published ? tx("Published", "منشورة") : tx("Draft", "مسودة")}</span>
        <Switch checked={row.published} onCheckedChange={onToggle} label={tx("Published", "منشورة")} />
      </span>
    </li>
  );
}
