'use client'

import { useState, useEffect } from 'react'
import { UserProvider } from '@/context/UserContext'
import { DesktopSidebar, MobileBottomNav } from '@/components/Sidebar'
import WeekView from '@/components/WeekView'
import DiscoverView from '@/components/DiscoverView'
import ShoppingListView from '@/components/ShoppingListView'
import SettingsView from '@/components/SettingsView'
import AppSettingsView from '@/components/AppSettingsView'
import OnboardingModal from '@/components/OnboardingModal'
import PasswordGate from '@/components/PasswordGate'
import DeviceGate from '@/components/DeviceGate'
import ErrorToast from '@/components/ErrorToast'
import { initializeErrorCapture } from '@/lib/errorLogger'

const ONBOARDING_KEY = 'hasSeenOnboarding'

export default function Home() {
  const [activeView, setActiveView] = useState('planner')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isOnboardingReplay, setIsOnboardingReplay] = useState(false)

  // Initialize error capture and check for first visit on mount
  useEffect(() => {
    // Initialize global error handlers for debug mode
    initializeErrorCapture()

    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY)
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
      setIsOnboardingReplay(false)
    }

    // Listen for replay event from settings
    const handleReplayOnboarding = () => {
      setIsOnboardingReplay(true)
      setShowOnboarding(true)
    }
    window.addEventListener('replay-onboarding', handleReplayOnboarding)
    return () => window.removeEventListener('replay-onboarding', handleReplayOnboarding)
  }, [])

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
    localStorage.setItem(ONBOARDING_KEY, 'true')
    // Navigate to planner on first-time completion
    if (!isOnboardingReplay) {
      setActiveView('planner')
    }
  }

  return (
    <PasswordGate>
      <DeviceGate>
        <UserProvider>
        <div className="h-screen bg-background overflow-hidden md:overflow-auto md:min-h-screen">
          {/* Desktop Sidebar */}
          <DesktopSidebar activeView={activeView} onNavigate={setActiveView} />

          {/* Main Content - fixed on mobile to prevent scroll */}
          <main className="md:ml-64 h-full md:min-h-screen pb-16 md:pb-0 overflow-hidden md:overflow-auto">
            {activeView === 'planner' && <WeekView />}
            {activeView === 'shopping' && <ShoppingListView />}
            {activeView === 'discover' && <DiscoverView />}
            {activeView === 'family' && <SettingsView />}
            {activeView === 'settings' && <AppSettingsView />}
          </main>

          {/* Mobile Bottom Nav */}
          <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />

          {/* Onboarding Modal */}
          {showOnboarding && (
            <OnboardingModal
              onClose={handleCloseOnboarding}
              isReplay={isOnboardingReplay}
            />
          )}

          {/* Debug Error Toast - visible with ?debug=true */}
          <ErrorToast />
        </div>
        </UserProvider>
      </DeviceGate>
    </PasswordGate>
  )
}
