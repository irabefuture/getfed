'use client'

import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  UtensilsCrossed, 
  CalendarDays, 
  History, 
  Settings,
  ChevronDown,
  LogOut
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Sidebar() {
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
    { icon: CalendarDays, label: 'Meal Plan', href: '/', active: true },
    { icon: History, label: 'History', href: '/history', active: false },
    { icon: Settings, label: 'Settings', href: '/settings', active: false },
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
      
      {/* Macro Targets */}
      {targets && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">Daily Targets</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background rounded p-2">
              <div className="text-sm font-semibold">{targets.protein}g</div>
              <div className="text-[10px] text-muted-foreground">Protein</div>
            </div>
            <div className="bg-background rounded p-2">
              <div className="text-sm font-semibold">{targets.fat}g</div>
              <div className="text-[10px] text-muted-foreground">Fat</div>
            </div>
            <div className="bg-background rounded p-2">
              <div className="text-sm font-semibold">{targets.carbs}g</div>
              <div className="text-[10px] text-muted-foreground">Carbs</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
    </aside>
  )
}
