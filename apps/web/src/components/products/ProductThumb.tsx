"use client";

import clsx from "clsx";
import Image from "next/image";
import { assetUrl } from "@/lib/config";
import { productIconFor } from "@/lib/product-icons";

type ProductThumbProps = {
  src: string | null;
  type: string;
  alt: string;
  size?: "sm" | "lg";
  onClick?: () => void;
  label?: string;
};

export function ProductThumb({ src, type, alt, size = "sm", onClick, label }: ProductThumbProps) {
  const content = src ? (
    <Image
      className="product-thumb__image"
      src={assetUrl(src)}
      alt={alt}
      width={size === "lg" ? 320 : 64}
      height={size === "lg" ? 240 : 48}
      unoptimized
    />
  ) : (
    <i className={clsx("product-thumb__icon bi", productIconFor(type))} aria-hidden="true" />
  );

  const className = clsx(
    "product-thumb",
    `product-thumb--${size}`,
    !src && "product-thumb--placeholder",
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={clsx(className, "product-thumb--button")}
        onClick={onClick}
        aria-label={label}
        title={label}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
