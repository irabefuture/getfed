'use client'

import { useState } from 'react'
import { UserProvider } from '@/context/UserContext'
import Sidebar from '@/components/Sidebar'
import WeekView from '@/components/WeekView'

export default function Home() {
  const [activeView, setActiveView] = useState('this-week')

  const handleNavigate = (viewId) => {
    setActiveView(viewId)
  }

  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onNavigate={handleNavigate} />
        
        {/* Main Content - offset by sidebar width */}
        <main className="ml-64 min-h-screen flex">
          {activeView === 'this-week' && <WeekView weekOffset={0} />}
          {activeView === 'next-week' && <WeekView weekOffset={1} />}
          {activeView === 'shopping' && (
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-bold mb-4">Shopping List</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          )}
          {activeView === 'settings' && (
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </UserProvider>
  )
}
