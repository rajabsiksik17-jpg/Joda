"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarCheck, Mail, MessageSquareText, Phone, X } from "lucide-react";
import { SocialIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";

export type FloatingAction = { id: string; kind: "phone" | "email" | "social" | "consultation"; label: string; href: string; platform?: string; external?: boolean };

type Visibility = { mobile: boolean; desktop: boolean };

const visibility = (v: Visibility) => cn(!v.mobile && "max-md:hidden", !v.desktop && "md:hidden");

const isField = (el: EventTarget | null) => el instanceof HTMLElement && (el.matches("input, textarea, select, [contenteditable=true]") || el.getAttribute("role") === "combobox");

/**
 * On phones the floating buttons step aside while the visitor scrolls down or types in a form,
 * so they never sit on top of content or fields; scrolling up brings them back.
 */
function useStepAside() {
  const [away, setAway] = useState(false);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    let lastY = window.scrollY;
    let typing = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (!mobile.matches) {
        lastY = y;
        return;
      }
      if (Math.abs(y - lastY) < 12) return;
      if (!typing) setAway(y > lastY && y > 240);
      lastY = y;
    };
    // Anything focused inside a form (fields, pickers, the submit button) keeps the buttons away, so they
    // never cover what the visitor is about to tap. They return shortly after focus leaves the form.
    let returnTimer: ReturnType<typeof setTimeout> | undefined;
    const inForm = (el: Element | null) => !!el?.closest("form") || isField(el);
    const onFocusIn = (e: FocusEvent) => {
      if (mobile.matches && inForm(e.target as Element)) {
        clearTimeout(returnTimer);
        typing = true;
        setAway(true);
      }
    };
    const onFocusOut = () => {
      clearTimeout(returnTimer);
      returnTimer = setTimeout(() => {
        if (inForm(document.activeElement)) return;
        typing = false;
        setAway(false);
      }, 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      clearTimeout(returnTimer);
    };
  }, []);
  return away;
}

const awayCls = (away: boolean) => (away ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100");

/** Expandable contact button (speed dial). Only channels that are configured are passed in. */
export function FloatingContact({ actions, side, show, labels }: { actions: FloatingAction[]; side: "start" | "end"; show: Visibility; labels: { open: string; close: string } }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const away = useStepAside() && !open;

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
    <div ref={rootRef} className={cn("fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col gap-3 transition-[transform,opacity] duration-300 sm:bottom-7", side === "start" ? "start-4 items-start sm:start-7" : "end-4 items-end sm:end-7", visibility(show), awayCls(away))}>
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
        className={cn("relative grid size-12 place-items-center rounded-full shadow-lift sm:size-14 transition-all duration-300 hover:scale-105 focus-visible:ring-4 focus-visible:ring-tech/40 focus-visible:outline-none", open ? "bg-white text-navy" : "bg-navy text-white")}
      >
        <MessageSquareText className={cn("absolute size-6 transition-all duration-300", open ? "scale-50 rotate-90 opacity-0" : "scale-100 opacity-100")} aria-hidden />
        <X className={cn("absolute size-6 transition-all duration-300", open ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0")} aria-hidden />
        {!open && <span className="fab-ping absolute inset-0 rounded-full border-2 border-tech-600" aria-hidden />}
      </button>
    </div>
  );
}

export function FloatingWhatsApp({ href, side, show, label }: { href: string; side: "start" | "end"; show: Visibility; label: string }) {
  const away = useStepAside();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-12 place-items-center rounded-full bg-[#25d366] text-white shadow-lift transition-[transform,opacity] duration-300 hover:scale-105 sm:size-14 focus-visible:ring-4 focus-visible:ring-[#25d366]/40 focus-visible:outline-none sm:bottom-7",
        side === "start" ? "start-4 sm:start-7" : "end-4 sm:end-7",
        visibility(show),
        awayCls(away),
      )}
    >
      <SocialIcon platform="whatsapp" className="size-6 sm:size-7" />
      <span className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-navy px-3.5 py-1.5 text-sm font-medium whitespace-nowrap opacity-0 shadow-lift transition-opacity duration-300 group-hover:opacity-100 max-md:hidden", side === "start" ? "start-full ms-3" : "end-full me-3")}>{label}</span>
    </a>
  );
}
