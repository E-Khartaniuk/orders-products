"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/config";

type UserAvatarProps = {
  src: string | null | undefined;
  alt: string;
  size: number;
  className?: string;
  priority?: boolean;
};

export function UserAvatar({ src, alt, size, className, priority }: UserAvatarProps) {
  return (
    <Image
      className={className}
      src={src ? assetUrl(src) : "/images/avatar.svg"}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized={Boolean(src)}
    />
  );
}
