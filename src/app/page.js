'use client'

import { useState } from 'react'
import { UserProvider } from '@/context/UserContext'
import { DesktopSidebar, MobileBottomNav, MobileHeader } from '@/components/Sidebar'
import WeekView from '@/components/WeekView'
import RecipesView from '@/components/RecipesView'
import ShoppingListView from '@/components/ShoppingListView'
import SettingsView from '@/components/SettingsView'
import AppSettingsView from '@/components/AppSettingsView'

export default function Home() {
  const [activeView, setActiveView] = useState('planner')

  return (
    <UserProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <DesktopSidebar activeView={activeView} onNavigate={setActiveView} />
        
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Main Content */}
        <main className="md:ml-64 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0">
          {activeView === 'planner' && <WeekView />}
          {activeView === 'recipes' && <RecipesView />}
          {activeView === 'shopping' && <ShoppingListView />}
          {activeView === 'family' && <SettingsView />}
          {activeView === 'settings' && <AppSettingsView />}
        </main>
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav activeView={activeView} onNavigate={setActiveView} />
      </div>
    </UserProvider>
  )
}
