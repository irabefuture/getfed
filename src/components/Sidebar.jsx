'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  CalendarDays, 
  CalendarPlus,
  ShoppingCart,
  Settings,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Sidebar({ activeView = 'this-week', onNavigate }) {
  const { users, user, setUser, targets, loading } = useUser()
  
  if (loading) {
    return (
      <aside className="w-64 h-screen bg-card border-r flex flex-col fixed left-0 top-0">
        <div className="p-4 animate-pulse">Loading...</div>
      </aside>
    )
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const navItems = [
    { id: 'this-week', icon: CalendarDays, label: 'This Week' },
    { id: 'next-week', icon: CalendarPlus, label: 'Next Week' },
    { id: 'shopping', icon: ShoppingCart, label: 'Shopping List' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="w-64 h-screen bg-card border-r flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-semibold text-lg">Meal Builder</span>
        </div>
      </div>
      
      {/* User Selector */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{user?.name || 'Select user'}</div>
                <div className="text-xs text-muted-foreground">
                  {targets?.dailyCalories} cal/day
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {users.map((u) => (
              <DropdownMenuItem 
                key={u.id} 
                onClick={() => setUser(u)}
                className={user?.id === u.id ? 'bg-accent' : ''}
              >
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                {u.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
      
      {/* Daily Targets - compact footer */}
      {targets && (
        <div className="p-4 border-t bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">Daily Targets</div>
          <div className="flex justify-between text-xs">
            <span>{targets.dailyCalories} cal</span>
            <span>{targets.protein}g P</span>
            <span>{targets.fat}g F</span>
            <span>{targets.carbs}g C</span>
          </div>
        </div>
      )}
    </aside>
  )
}
