import Image from "next/image";

/**
 * SparkNourish brand mark — the app icon (leaves + spark on sand). The asset
 * has transparent corners and a sand background that matches the page surface.
 */
export function BrandMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <Image
      src="/SparkNourishIcon.png"
      alt="SparkNourish"
      width={500}
      height={500}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
