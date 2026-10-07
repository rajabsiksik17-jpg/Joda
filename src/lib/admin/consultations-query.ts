import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export const CONSULTATION_STATUSES = ["PENDING", "CONTACTED", "COMPLETED", "ARCHIVED"] as const;
export type ConsultationStatusKey = (typeof CONSULTATION_STATUSES)[number];

export type ConsultationFilter = { status?: string; q?: string; service?: string; country?: string };

export function consultationWhere({ status, q, service, country }: ConsultationFilter): Prisma.ConsultationRequestWhereInput {
  const s = (CONSULTATION_STATUSES as readonly string[]).includes(status ?? "") ? (status as ConsultationStatusKey) : undefined;
  const term = q?.trim().slice(0, 100);
  return {
    // Archived requests only show when explicitly filtered.
    ...(s ? { status: s } : { status: { not: "ARCHIVED" } }),
    ...(service ? { serviceId: service.slice(0, 64) } : {}),
    ...(country && /^[A-Z]{2}$/.test(country) ? { country } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { company: { contains: term, mode: "insensitive" } },
            { phoneE164: { contains: term.replace(/[^\d+]/g, "") || term } },
            { serviceTitle: { contains: term, mode: "insensitive" } },
            { message: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
