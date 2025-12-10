'use client'

import { useState, useEffect } from 'react'
import { Smartphone } from 'lucide-react'

export default function DeviceGate({ children }) {
  const [isMobile, setIsMobile] = useState(true) // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      // Check screen width (768px is standard md breakpoint)
      const isSmallScreen = window.innerWidth < 768

      // Also check user agent for mobile devices
      const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      setIsMobile(isSmallScreen || mobileUserAgent)
      setIsLoading(false)
    }

    checkDevice()

    // Re-check on resize (in case browser window is resized)
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Show nothing while checking
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Desktop - show blocking message
  if (!isMobile) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-3">Getfed is designed for mobile</h1>

          <p className="text-muted-foreground mb-8">
            Open this app on your phone for the best experience.
          </p>

          {/* QR Code placeholder - using a simple text URL for now */}
          <div className="p-6 bg-muted/30 rounded-xl border">
            <p className="text-sm text-muted-foreground mb-2">Scan or visit:</p>
            <p className="font-mono text-lg font-medium">getfed.app</p>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Or resize your browser window to mobile size.
          </p>
        </div>
      </div>
    )
  }

  // Mobile - render children
  return children
}
