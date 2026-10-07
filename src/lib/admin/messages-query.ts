import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type MessageFilter = { status?: string; q?: string };

export function messageWhere({ status, q }: MessageFilter): Prisma.ContactMessageWhereInput {
  const s = status === "NEW" || status === "READ" || status === "ARCHIVED" ? status : undefined;
  const term = q?.trim().slice(0, 100);
  return {
    ...(s ? { status: s } : { status: { not: "ARCHIVED" } }),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { company: { contains: term, mode: "insensitive" } },
            { subject: { contains: term, mode: "insensitive" } },
            { message: { contains: term, mode: "insensitive" } },
            { service: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
