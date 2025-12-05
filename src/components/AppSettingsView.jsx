'use client'

import { Settings } from 'lucide-react'

/**
 * App Settings View - placeholder for future app-level settings
 * (account, preferences, display options, etc.)
 */
export default function AppSettingsView() {
  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl">
      <h1 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      <div className="space-y-6">
        {/* Account Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <p className="text-muted-foreground text-sm">
            Account settings and preferences coming soon.
          </p>
        </section>

        {/* Display Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Display</h2>
          <p className="text-muted-foreground text-sm">
            Theme, language, and display preferences coming soon.
          </p>
        </section>

        {/* About Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium">Adaptive Meal Builder</span></p>
            <p>Version 0.1.0 (Beta)</p>
            <p>Built with Next.js, Supabase, and Claude AI</p>
          </div>
        </section>
      </div>
    </div>
  )
}
