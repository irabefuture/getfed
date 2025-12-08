'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '@/context/UserContext'
import { calculateMemberDayTotals } from '@/lib/smartPlanner'
import { toISODate } from '@/lib/dates'
import {
  CalendarDays,
  ListChecks,
  Settings,
  Book,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'planner', icon: CalendarDays, label: 'Meal Planner', shortLabel: 'Planner' },
  { id: 'recipes', icon: Book, label: 'Recipes', shortLabel: 'Recipes' },
  { id: 'shopping', icon: ListChecks, label: 'Shopping List', shortLabel: 'Shopping' },
  { id: 'family', icon: Users, label: 'Family Plan', shortLabel: 'Family' },
]

/**
 * Desktop Sidebar - hidden on mobile
 */
export function DesktopSidebar({ activeView = 'planner', onNavigate }) {
  const { loading, members, isHouseholdMode, user } = useUser()
  const [expandedMembers, setExpandedMembers] = useState({})
  const [dayMeals, setDayMeals] = useState({})
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()))

  // Sort members: primary first
  const sortedMembers = [...(members || [])].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return 0
  })

  // Listen for date changes from WeekView
  useEffect(() => {
    const handleDateChange = (e) => {
      setSelectedDate(e.detail.date)
    }
    
    window.addEventListener('planner-date-changed', handleDateChange)
    return () => window.removeEventListener('planner-date-changed', handleDateChange)
  }, [])

  // Load selected day's meals from localStorage
  useEffect(() => {
    if (!user) return

    const loadMeals = () => {
      const storageKey = `meal-plan-${user.id}`
      
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const allMeals = JSON.parse(saved)
          setDayMeals(allMeals[selectedDate] || {})
        } else {
          setDayMeals({})
        }
      } catch (e) {
        console.error('Failed to load meals:', e)
        setDayMeals({})
      }
    }

    // Load initially
    loadMeals()

    // Listen for storage changes (when WeekView updates)
    const handleStorageChange = (e) => {
      if (e.key === `meal-plan-${user.id}`) {
        loadMeals()
      }
    }

    // Also poll for changes since storage events don't fire in same tab
    const interval = setInterval(loadMeals, 1000)

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user?.id, selectedDate])

  const toggleMember = (memberId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }))
  }

  const expandAll = () => {
    const allExpanded = {}
    sortedMembers.forEach(m => { allExpanded[m.id] = true })
    setExpandedMembers(allExpanded)
  }

  const collapseAll = () => {
    setExpandedMembers({})
  }

  const allExpanded = sortedMembers.length > 0 && sortedMembers.every(m => expandedMembers[m.id])

  if (loading) {
    return (
      <aside className="hidden md:flex w-64 h-screen bg-card border-r flex-col fixed left-0 top-0">
        <div className="p-4 animate-pulse">Loading...</div>
      </aside>
    )
  }

  return (
    <aside className="hidden md:flex w-64 h-screen bg-card border-r flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-semibold text-lg">Meal Builder</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate?.(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Daily Targets Section */}
      {isHouseholdMode && sortedMembers.length > 0 && (
        <div className="flex-1 border-t overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Daily Targets
              </h3>
              <button
                onClick={allExpanded ? collapseAll : expandAll}
                className="text-xs text-primary hover:underline"
              >
                {allExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            
            <div className="space-y-2">
              {sortedMembers.map(member => {
                const isExpanded = expandedMembers[member.id]
                const targets = member.targets || {}
                const totals = Object.keys(dayMeals).length > 0 
                  ? calculateMemberDayTotals(dayMeals, member)
                  : { calories: 0, protein: 0, fat: 0, carbs: 0 }
                
                // Calculate percentage for collapsed view
                const calPercent = targets.dailyCalories > 0 
                  ? Math.round((totals.calories / targets.dailyCalories) * 100) 
                  : 0
                
                return (
                  <div key={member.id} className="bg-muted/30 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMember(member.id)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="font-semibold text-sm">{member.name}</span>
                        {member.is_primary && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-normal ${calPercent > 100 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {totals.calories}/{targets.dailyCalories}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <MacroBox 
                            label="Calories" 
                            current={totals.calories} 
                            target={targets.dailyCalories} 
                          />
                          <MacroBox 
                            label="Protein" 
                            current={totals.protein} 
                            target={targets.protein} 
                            unit="g"
                          />
                          <MacroBox 
                            label="Fats" 
                            current={totals.fat} 
                            target={targets.fat} 
                            unit="g"
                          />
                          <MacroBox 
                            label="Carbs" 
                            current={totals.carbs} 
                            target={targets.carbs} 
                            unit="g"
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Phase {member.current_phase} · {member.activity_level}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer when no Daily Targets */}
      {(!isHouseholdMode || sortedMembers.length === 0) && (
        <div className="flex-1" />
      )}
      
      {/* Settings at bottom */}
      <div className="border-t p-4">
        <button
          onClick={() => onNavigate?.('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            activeView === 'settings'
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-accent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  )
}

/**
 * Macro progress box with fill background at bottom
 */
function MacroBox({ label, current, target, unit = '' }) {
  const percent = target > 0 ? (current / target) * 100 : 0
  const isOver = percent > 100
  
  // Cap visual fill at 100%
  const fillPercent = Math.min(percent, 100)
  
  // Colors - green for on track, red for over
  const fillColor = isOver ? 'bg-red-500' : 'bg-green-500'
  const textColor = isOver ? 'text-red-600 font-medium' : ''
  
  return (
    <div className="relative rounded p-2 overflow-hidden bg-muted/40 border border-border/50">
      {/* Progress fill at bottom only */}
      <div className="absolute bottom-0 left-0 right-0 h-1">
        <div 
          className={`h-full ${fillColor} transition-all duration-300`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      
      {/* Overflow indicator - red stripe on right if over 100% */}
      {isOver && (
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-red-500" />
      )}
      
      {/* Content */}
      <div className="relative text-xs">
        <div className="text-muted-foreground mb-0.5">{label}</div>
        <div className={`font-medium ${textColor}`}>
          {current}{unit}/{target}{unit}
        </div>
      </div>
    </div>
  )
}

/**
 * Mobile Bottom Navigation - standard always-visible bottom nav
 * Planner | Recipes | Shopping | Family | Settings
 */
export function MobileBottomNav({ activeView = 'planner', onNavigate }) {
  // Add settings to mobile nav items
  const mobileNavItems = [...NAV_ITEMS, { id: 'settings', icon: Settings, label: 'Settings', shortLabel: 'Settings' }]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {mobileNavItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`flex flex-col items-center justify-center h-full px-3 min-w-[56px] ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * Mobile Header - shows on mobile only
 */
export function MobileHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b z-50 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥗</span>
          <span className="font-semibold">Meal Builder</span>
        </div>
      </div>
    </header>
  )
}

// Keep default export for backwards compatibility
export default function Sidebar(props) {
  return <DesktopSidebar {...props} />
}
