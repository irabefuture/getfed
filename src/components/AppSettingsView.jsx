'use client'

import { useState, useEffect } from 'react'
import { Settings, HelpCircle, LogOut, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAuth } from '@/components/PasswordGate'
import { isDebugMode, enableDebugMode, disableDebugMode, logDebug } from '@/lib/errorLogger'

/**
 * App Settings View - placeholder for future app-level settings
 * (account, preferences, display options, etc.)
 */
export default function AppSettingsView() {
  const [debugEnabled, setDebugEnabled] = useState(false)

  // Check debug mode on mount
  useEffect(() => {
    setDebugEnabled(isDebugMode())
  }, [])

  const handleShowIntro = () => {
    window.dispatchEvent(new CustomEvent('replay-onboarding'))
  }

  const handleSignOut = () => {
    clearAuth()
  }

  const handleToggleDebug = () => {
    if (debugEnabled) {
      disableDebugMode()
      setDebugEnabled(false)
    } else {
      enableDebugMode()
      setDebugEnabled(true)
      // Log a test message to confirm it's working
      logDebug('DebugMode:enabled', { timestamp: new Date().toISOString() })
    }
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

        {/* Developer Section */}
        <section className="p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Developer
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Debug mode shows a floating panel with error logs and debug info.
            Also available via URL: <code className="text-xs bg-muted px-1 py-0.5 rounded">?debug=true</code>
          </p>
          <Button
            variant={debugEnabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleDebug}
          >
            <Bug className="h-4 w-4 mr-2" />
            {debugEnabled ? 'Debug Mode ON' : 'Enable Debug Mode'}
          </Button>
          {debugEnabled && (
            <p className="text-xs text-green-600 mt-2">
              Debug panel will show when errors occur or debug logs are recorded.
            </p>
          )}
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
