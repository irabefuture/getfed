'use client'

import { Settings, HelpCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAuth } from '@/components/PasswordGate'

/**
 * App Settings View - placeholder for future app-level settings
 * (account, preferences, display options, etc.)
 */
export default function AppSettingsView() {
  const handleShowIntro = () => {
    window.dispatchEvent(new CustomEvent('replay-onboarding'))
  }

  const handleSignOut = () => {
    clearAuth()
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl h-full overflow-y-auto pb-24">
      <h1 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      <div className="space-y-6">
        {/* Account Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <p className="text-muted-foreground text-sm mb-3">
            Sign out to return to the password screen.
          </p>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </section>

        {/* Display Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Display</h2>
          <p className="text-muted-foreground text-sm">
            Theme, language, and display preferences coming soon.
          </p>
        </section>

        {/* Help Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">Help</h2>
          <p className="text-muted-foreground text-sm mb-3">
            Need a refresher on how to use the app?
          </p>
          <Button variant="outline" size="sm" onClick={handleShowIntro}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Replay app guide
          </Button>
        </section>

        {/* About Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><span className="font-medium">Getfed</span></p>
            <p>Version 0.1.0 (Beta)</p>
            <p>Built with Next.js, Supabase, and Claude AI</p>
          </div>
        </section>
      </div>
    </div>
  )
}
