'use client'

import { Sparkles } from 'lucide-react'

/**
 * Discover View - Placeholder for future recipe discovery features
 */
export default function DiscoverView() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <p className="text-lg text-muted-foreground mb-8">Coming Soon</p>

        {/* Description */}
        <div className="text-left space-y-3 text-sm text-muted-foreground mb-8">
          <p>This is where you'll be able to:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Add your own recipes (AI checks they fit your macros)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Get fresh meal ideas generated just for you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Build a personalised recipe collection based on what you love</span>
            </li>
          </ul>
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground/70">
          For now, use the Planner to explore our 90 curated recipes.
        </p>
      </div>
    </div>
  )
}
