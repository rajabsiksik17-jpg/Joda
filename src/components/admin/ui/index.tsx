"use client";

import { forwardRef, useState } from "react";
import { AlertDialog, Dialog, DropdownMenu, Popover, Switch as RSwitch, Tabs as RTabs } from "radix-ui";
import { LoaderCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminI18n } from "../i18n";

// ───────────────────────── Buttons ─────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "navy";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
};

const BTN_VARIANTS = {
  primary: "bg-tech-600 text-white hover:bg-tech-700 shadow-sm",
  navy: "bg-navy text-white hover:bg-navy-800",
  secondary: "border border-line-strong bg-white text-ink hover:bg-surface",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        size === "sm" ? "h-8 px-3 text-[0.8rem]" : size === "icon" ? "size-9" : "h-10 px-4 text-sm",
        BTN_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

// ───────────────────────── Form controls ─────────────────────────
export const inputCls =
  "w-full rounded-md border border-line-strong bg-white px-3 text-sm text-ink shadow-[inset_0_1px_1px_rgba(7,31,63,0.03)] transition-colors placeholder:text-muted/70 focus:border-tech focus:outline-none focus:ring-2 focus:ring-tech/20 disabled:bg-surface aria-invalid:border-red-500";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputCls, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputCls, "min-h-20 resize-y py-2 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputCls, "h-10 pe-8", className)} {...props}>
      {children}
    </select>
  );
});

export function Switch({ checked, onCheckedChange, label, id, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string; id?: string; disabled?: boolean }) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-line-strong transition-colors data-[state=checked]:bg-tech disabled:opacity-50"
    >
      <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[1.375rem] rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-[1.375rem]" />
    </RSwitch.Root>
  );
}

export function FieldShell({ label, htmlFor, help, error, required, children, className }: { label?: string; htmlFor?: string; help?: string; error?: string | null; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8rem] font-semibold text-ink">
          {label}
          {required && <span className="text-tech-600"> *</span>}
        </label>
      )}
      {children}
      {help && !error && <p className="mt-1 text-xs text-muted">{help}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// ───────────────────────── Feedback ─────────────────────────
export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "success" | "warning" | "info" | "danger" | "navy"; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-slate",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    info: "bg-sky-50 text-tech-700 ring-sky-100",
    danger: "bg-red-50 text-red-700 ring-red-200",
    navy: "bg-navy text-white",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold whitespace-nowrap ring-1 ring-transparent ring-inset", tones[tone], className)}>{children}</span>;
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-white px-6 py-14 text-center">
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-full bg-sky-50 text-tech-600">{icon}</div>}
      <p className="text-base font-semibold text-ink">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-line bg-white shadow-[0_1px_2px_rgba(7,31,63,0.04)]", className)} {...props}>
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  const { tx } = useAdminI18n();
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? tx("Search…", "بحث…")} aria-label={placeholder ?? tx("Search", "بحث")} className={cn(inputCls, "h-10 ps-9")} />
    </div>
  );
}

// ───────────────────────── Overlays ─────────────────────────
export function Modal({ open, onOpenChange, title, description, children, footer, size = "md" }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  const { tx } = useAdminI18n();
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-6xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px] data-[state=open]:animate-[fade-up_0.2s_ease-out]" />
        <Dialog.Content className={cn("fixed top-1/2 left-1/2 z-50 flex max-h-[min(92svh,900px)] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-2xl focus:outline-none", w)}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Close", "إغلاق")}>
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/60 px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Wide side panel for editing without leaving the current context. */
export function Drawer({ open, onOpenChange, title, description, children, footer, width = "lg" }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; width?: "md" | "lg" | "xl" }) {
  const { tx } = useAdminI18n();
  const w = { md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[width];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-[2px]" />
        <Dialog.Content className={cn("fixed inset-y-0 end-0 z-50 flex w-full flex-col bg-white shadow-2xl focus:outline-none", w, "data-[state=open]:animate-[drawer-in_0.28s_cubic-bezier(0.16,1,0.3,1)]")}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-semibold text-ink">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            <Dialog.Close className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-surface hover:text-ink" aria-label={tx("Close", "إغلاق")}>
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/60 px-5 py-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  danger = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const { tx } = useAdminI18n();
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-navy/45 backdrop-blur-[2px]" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-[60] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-muted">{description ?? tx("This action cannot be undone.", "لا يمكن التراجع عن هذا الإجراء.")}</AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">{tx("Cancel", "إلغاء")}</Button>
            </AlertDialog.Cancel>
            <Button
              variant={danger ? "danger" : "primary"}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  onOpenChange(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel ?? tx("Delete", "حذف")}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export const Menu = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;
export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content align={align} sideOffset={6} className="z-[55] min-w-48 rounded-lg border border-line bg-white p-1 shadow-lift">
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}
export function MenuItem({ onSelect, children, danger, disabled }: { onSelect?: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn("flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface", danger ? "text-red-600" : "text-ink")}
    >
      {children}
    </DropdownMenu.Item>
  );
}
export const MenuSeparator = () => <DropdownMenu.Separator className="my-1 h-px bg-line" />;

export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export function PopoverContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Popover.Portal>
      <Popover.Content sideOffset={6} align="start" className={cn("z-[55] rounded-lg border border-line bg-white p-3 shadow-lift", className)}>
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

// ───────────────────────── Tabs ─────────────────────────
export function Tabs({ value, onValueChange, items, className }: { value: string; onValueChange: (v: string) => void; items: { value: string; label: React.ReactNode }[]; className?: string }) {
  return (
    <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RTabs.List className="flex gap-1 overflow-x-auto border-b border-line">
        {items.map((i) => (
          <RTabs.Trigger
            key={i.value}
            value={i.value}
            className="relative -mb-px shrink-0 border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink data-[state=active]:border-tech data-[state=active]:text-ink"
          >
            {i.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
    </RTabs.Root>
  );
}

// ───────────────────────── Page header ─────────────────────────
export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
