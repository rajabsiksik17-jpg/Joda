"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarCheck, Mail, MessageSquareText, Phone, X } from "lucide-react";
import { SocialIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";

export type FloatingAction = { id: string; kind: "phone" | "email" | "social" | "consultation"; label: string; href: string; platform?: string; external?: boolean };

type Visibility = { mobile: boolean; desktop: boolean };

const visibility = (v: Visibility) => cn(!v.mobile && "max-md:hidden", !v.desktop && "md:hidden");

/** Expandable contact button (speed dial). Only channels that are configured are passed in. */
export function FloatingContact({ actions, side, show, labels }: { actions: FloatingAction[]; side: "start" | "end"; show: Visibility; labels: { open: string; close: string } }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <div ref={rootRef} className={cn("fixed bottom-5 z-40 flex flex-col gap-3 sm:bottom-7", side === "start" ? "start-4 items-start sm:start-7" : "end-4 items-end sm:end-7", visibility(show))}>
      <ul id={listId} className={cn("flex flex-col gap-2.5", side === "start" ? "items-start" : "items-end", !open && "pointer-events-none")} aria-hidden={!open}>
        {actions.map((a, i) => {
          const IconCmp = a.kind === "phone" ? Phone : a.kind === "email" ? Mail : a.kind === "consultation" ? CalendarCheck : null;
          return (
            <li
              key={a.id}
              className={cn("transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none", open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-90 opacity-0")}
              style={{ transitionDelay: open ? `${(actions.length - 1 - i) * 40}ms` : "0ms" }}
            >
              <a
                href={a.href}
                target={a.external ? "_blank" : undefined}
                rel={a.external ? "noopener noreferrer" : undefined}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className={cn("group flex items-center gap-3", side === "end" && "flex-row-reverse")}
              >
                <span className={cn("grid size-12 place-items-center rounded-full shadow-lift transition-colors", a.kind === "consultation" ? "bg-tech-600 text-white" : "bg-white text-navy group-hover:bg-navy group-hover:text-white")}>
                  {IconCmp ? <IconCmp className="size-5" aria-hidden /> : <SocialIcon platform={a.platform ?? "website"} className="size-5" />}
                </span>
                <span className="rounded-full bg-navy px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white shadow-lift">{a.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((o) => !o)}
        className={cn("relative grid size-14 place-items-center rounded-full shadow-lift transition-all duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-tech/40 focus-visible:outline-none", open ? "bg-white text-navy" : "bg-navy text-white")}
      >
        <MessageSquareText className={cn("absolute size-6 transition-all duration-300", open ? "scale-50 rotate-90 opacity-0" : "scale-100 opacity-100")} aria-hidden />
        <X className={cn("absolute size-6 transition-all duration-300", open ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0")} aria-hidden />
        {!open && <span className="fab-ping absolute inset-0 rounded-full border-2 border-tech-600" aria-hidden />}
      </button>
    </div>
  );
}

export function FloatingWhatsApp({ href, side, show, label }: { href: string; side: "start" | "end"; show: Visibility; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "group fixed bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lift transition-transform duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25d366]/40 focus-visible:outline-none sm:bottom-7",
        side === "start" ? "start-4 sm:start-7" : "end-4 sm:end-7",
        visibility(show),
      )}
    >
      <SocialIcon platform="whatsapp" className="size-7" />
      <span className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-navy px-3.5 py-1.5 text-sm font-medium whitespace-nowrap opacity-0 shadow-lift transition-opacity duration-300 group-hover:opacity-100 max-md:hidden", side === "start" ? "start-full ms-3" : "end-full me-3")}>{label}</span>
    </a>
  );
}
