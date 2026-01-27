"use client"

import { useTheme } from "next-themes"
import Image, { type ImageProps } from "next/image"

import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

interface LogoProps extends Omit<ImageProps, "src" | "alt"> {
  fallbackAsText?: boolean
}

// Helper to track client-side mounting without setState in effect
const emptySubscribe = () => () => { }
const getSnapshot = () => true
const getServerSnapshot = () => false

export function Logo({
  className,
  fallbackAsText = true,
  ...props
}: LogoProps) {
  const { theme } = useTheme()
  // useSyncExternalStore is the recommended way to handle hydration-aware client values
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  if (!mounted && fallbackAsText) {
    return (
      <span className={cn("text-xl md:text-2xl font-bold text-foreground", className)}>
        NEXA
      </span>
    )
  }

  // If not mounted and not fallbackAsText, we render nothing to avoid hydration mismatch
  // or we could render a default placeholder if needed.
  // But based on previous logic, let's just return null until mounted to be safe
  if (!mounted) {
    return null
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
