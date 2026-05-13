"use client";

import { cn } from "@/lib/utils";

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  /** Approximate box size around the point (degrees). */
  pad?: number;
  /** Iframe height in px — keep small for forms. */
  height?: number;
  className?: string;
};

/** Minimal OSM embed centered on coordinates (no extra map libs). */
export function LocationMapPreview({
  latitude,
  longitude,
  pad = 0.012,
  height = 168,
  className,
}: LocationMapPreviewProps) {
  const minLon = longitude - pad;
  const minLat = latitude - pad;
  const maxLon = longitude + pad;
  const maxLat = latitude + pad;
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm",
        className,
      )}
    >
      <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
        Location preview
      </p>
      <iframe
        title="Map preview for selected address"
        src={src}
        className="pointer-events-auto block w-full border-0 bg-muted/20"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=17`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Open full map
        </a>
      </div>
    </div>
  );
}
