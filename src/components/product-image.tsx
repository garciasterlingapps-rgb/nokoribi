"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

export function ProductImage({
  src,
  alt,
  fallback,
  className,
}: {
  src: string | null;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
