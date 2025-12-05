"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Simple checkbox using native HTML input
 * Styled with Tailwind - no Radix dependency needed
 */
const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, id, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className={cn(
      "h-4 w-4 shrink-0 rounded border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "accent-primary cursor-pointer",
      className
    )}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
