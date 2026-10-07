import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/localized";
import type { MediaAsset } from "@/lib/media";

/** Renders an uploaded image through next/image (SVGs are served as-is). */
export function MediaImage({
  asset,
  locale,
  alt,
  sizes = "100vw",
  className,
  fill,
  priority,
}: {
  asset: MediaAsset | null;
  locale: Locale;
  alt?: string;
  sizes?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  if (!asset || asset.isVideo) return null;
  const altText = alt ?? tr(asset.alt, locale, true);
  if (fill) {
    return <Image src={asset.url} alt={altText} fill sizes={sizes} className={className} priority={priority} unoptimized={asset.isSvg} />;
  }
  return (
    <Image
      src={asset.url}
      alt={altText}
      width={asset.width ?? 1200}
      height={asset.height ?? 800}
      sizes={sizes}
      className={className}
      priority={priority}
      unoptimized={asset.isSvg}
    />
  );
}
