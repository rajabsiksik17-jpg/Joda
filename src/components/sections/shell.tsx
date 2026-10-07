import type { Locale } from "@/lib/i18n/config";
import type { SectionSettings } from "@/lib/sections/registry";
import { cn } from "@/lib/cn";

export type SectionContext = {
  locale: Locale;
  /** Path without locale, e.g. "/about" */
  path: string;
  pageTitle: string;
  searchParams: Record<string, string | string[] | undefined>;
  isPreview: boolean;
  /** Index of the section on the page (0 = first) */
  index: number;
};

export type SectionProps<T = Record<string, unknown>> = { data: T; settings: Partial<SectionSettings>; ctx: SectionContext };

const SPACING = { normal: "section-y", compact: "section-y-compact", spacious: "section-y-spacious" } as const;

export function SectionShell({
  settings,
  defaultTheme = "light",
  className,
  children,
  bare = false,
  label,
}: {
  settings: Partial<SectionSettings>;
  defaultTheme?: "light" | "muted" | "navy";
  className?: string;
  children: React.ReactNode;
  /** Skip vertical padding (sections that manage their own) */
  bare?: boolean;
  label?: string;
}) {
  const theme = settings.theme && settings.theme !== "default" ? settings.theme : defaultTheme;
  const spacing = SPACING[(settings.spacing as keyof typeof SPACING) ?? "normal"] ?? SPACING.normal;
  return (
    <section
      id={settings.anchor || undefined}
      aria-label={label}
      className={cn(
        "relative",
        `theme-${theme}`,
        !bare && spacing,
        settings.hideOn === "mobile" && "hide-mobile",
        settings.hideOn === "desktop" && "hide-desktop",
        className,
      )}
    >
      {children}
    </section>
  );
}
