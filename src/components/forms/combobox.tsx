"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type ComboOption = { value: string; label: string; hint?: string; group?: string; leading?: React.ReactNode; keywords?: string };

// Case-, diacritic- and hamza-insensitive matching so Arabic and English searches both feel forgiving.
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

/**
 * Searchable select (WAI-ARIA combobox + listbox). Keyboard: ↑ ↓ Home End to move, Enter to choose, Esc to close.
 * Options may be grouped; group headings are not selectable.
 */
export function Combobox({
  id,
  name,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResults,
  invalid,
  describedBy,
  renderValue,
  className,
  panelClassName,
  label,
  panelDir,
}: {
  id: string;
  name?: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResults: string;
  invalid?: boolean;
  describedBy?: string;
  renderValue?: (o: ComboOption) => React.ReactNode;
  className?: string;
  panelClassName?: string;
  /** Accessible name when no visible <label for> points at the button */
  label?: string;
  /** Direction of the dropdown panel (lets an LTR control such as a calling-code picker list Arabic names RTL) */
  panelDir?: "rtl" | "ltr";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const q = norm(query.trim());
  const filtered = q ? options.filter((o) => norm(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`).includes(q)) : options;
  const selected = options.find((o) => o.value === value);

  // Close when clicking or focusing outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent | FocusEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("focusin", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("focusin", onDown);
    };
  }, [open]);

  const reveal = (i: number) => requestAnimationFrame(() => listRef.current?.querySelector(`[data-index="${i}"]`)?.scrollIntoView({ block: "nearest" }));

  const openList = () => {
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    setQuery("");
    setActive(i);
    setOpen(true);
    reveal(i);
  };
  const choose = (o: ComboOption | undefined) => {
    if (!o) return;
    onChange(o.value);
    setOpen(false);
    buttonRef.current?.focus();
  };
  const move = (i: number) => {
    const n = Math.max(0, Math.min(filtered.length - 1, i));
    setActive(n);
    reveal(n);
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") move(active + 1);
    else if (e.key === "ArrowUp") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(filtered.length - 1);
    else if (e.key === "PageDown") move(active + 8);
    else if (e.key === "PageUp") move(active - 8);
    else if (e.key === "Enter") choose(filtered[active]);
    else if (e.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (e.key === "Tab") setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-[2px] border bg-white px-4 text-start text-ink transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:shadow-[0_0_0_4px_rgb(22_143_193/0.14)]",
          invalid ? "border-red-600 shadow-[0_0_0_4px_rgb(220_38_38/0.08)]" : open ? "border-tech-600 shadow-[0_0_0_4px_rgb(22_143_193/0.14)]" : "border-line-strong hover:border-ink/35",
          className,
        )}
      >
        <span className={cn("flex min-w-0 flex-1 items-center gap-2.5 truncate", !selected && "text-muted/80")}>
          {selected ? (renderValue ? renderValue(selected) : <>{selected.leading}<span className="truncate">{selected.label}</span></>) : placeholder}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-tech-600 transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div dir={panelDir} className={cn("combo-panel absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden border border-line bg-white shadow-lift", panelClassName)}>
          <div className="relative border-b border-line">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              autoFocus
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
                listRef.current?.scrollTo({ top: 0 });
              }}
              onKeyDown={onSearchKey}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-11 w-full bg-surface/50 ps-10 pe-4 text-sm text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto overscroll-contain py-1.5">
            {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">{noResults}</li>}
            {filtered.map((o, i) => {
              const heading = o.group && o.group !== filtered[i - 1]?.group ? o.group : null;
              const isSel = o.value === value;
              return (
                <li key={`${o.group ?? ""}-${o.value}`} role="presentation">
                  {heading && <p className="px-4 pt-3 pb-1.5 text-[0.7rem] font-semibold tracking-[0.12em] text-tech-600 uppercase rtl:tracking-normal" aria-hidden>{heading}</p>}
                  <div
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSel}
                    onPointerMove={() => active !== i && setActive(i)}
                    onClick={() => choose(o)}
                    className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors", i === active ? "bg-sky-50 text-ink" : "text-ink/90")}
                  >
                    {o.leading}
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate", isSel && "font-semibold")}>{o.label}</span>
                    </span>
                    {o.hint && <span className="shrink-0 text-xs text-muted" dir="ltr">{o.hint}</span>}
                    {isSel && <Check className="size-4 shrink-0 text-tech-600" aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
