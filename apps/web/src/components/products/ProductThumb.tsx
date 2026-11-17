import Image from "next/image";

export function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <Image
      className="product-thumb"
      src={src ?? "/images/product-placeholder.svg"}
      alt={alt}
      width={64}
      height={48}
      unoptimized
    />
  );
}
