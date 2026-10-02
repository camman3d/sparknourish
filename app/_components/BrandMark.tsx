import { Leaf } from "lucide-react";

/**
 * SparkNourish brand logo — PLACEHOLDER.
 *
 * Official logo assets from Sparkwell Creative aren't available yet, so this
 * renders the leaf mark inside a forest circle as a stand-in. When the real
 * assets land, swap the inner markup here (and only here) for the logo image.
 */
export function BrandMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="SparkNourish logo (placeholder)"
      className={`flex shrink-0 items-center justify-center rounded-full bg-forest-800 text-forest-100 ${className}`}
    >
      <Leaf className="h-1/2 w-1/2" strokeWidth={1.75} aria-hidden />
    </span>
  );
}
