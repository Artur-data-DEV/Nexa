"use client"

import { useTheme } from "next-themes"
import Image, { type ImageProps } from "next/image"

import { cn } from "@/lib/utils"

interface LogoProps extends Omit<ImageProps, "src" | "alt"> {
  fallbackAsText?: boolean
}

export function Logo({
  className,
  fallbackAsText = true,
  ...props
}: LogoProps) {
  const { theme } = useTheme()
  const isServer = typeof window === "undefined"

  if (isServer && fallbackAsText) {
    return (
      <span className={cn("text-xl md:text-2xl font-bold text-foreground", className)}>
        NEXA
      </span>
    )
  }

  const src = theme === "dark" ? "/assets/light-logo.png" : "/assets/dark-logo.png"

  return (
    <Image
      src={src}
      alt="NEXA"
      className={className}
      {...props}
    />
  )
}

