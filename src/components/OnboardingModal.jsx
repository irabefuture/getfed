'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarDays, ListChecks, Sparkles, ChevronRight, ChevronLeft, Printer, Users, Settings } from 'lucide-react'

export default function OnboardingModal({ onClose, isReplay = false }) {
  const [currentPage, setCurrentPage] = useState(0)

  const isFirst = currentPage === 0
  const isLast = currentPage === 3

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    if (!isReplay) {
      // Trigger pulse animation on first day
      window.dispatchEvent(new CustomEvent('onboarding-complete'))
    }
    onClose()
  }

  // Page 0: Welcome
  if (currentPage === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 pb-20 md:pb-4">
        <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center mb-3">Welcome to Getfed</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Your weekly meals, tailored to your nutrition targets.
          </p>
          <PageIndicators current={0} total={4} />
          <NavButtons
            isFirst={true}
            isLast={false}
            onPrev={handlePrev}
            onNext={handleNext}
            onSkip={handleSkip}
            isReplay={isReplay}
          />
        </div>
      </div>
    )
  }

  // Page 1: Planner with visual highlights
  if (currentPage === 1) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black/70">
        {/* Top highlight area - Day strip */}
        <div className="pt-16 md:pt-4 px-4">
          <div className="relative max-w-2xl mx-auto">
            {/* Fake day strip highlight */}
            <div className="bg-card/95 rounded-lg p-3 border-2 border-primary shadow-lg">
              <div className="flex gap-2 overflow-x-auto">
                {['Today', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div
                    key={day}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-center text-xs ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="flex justify-center mt-2">
              <span className="text-2xl animate-bounce">👆</span>
            </div>
          </div>
        </div>

        {/* Middle area - Meal card highlight */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="relative max-w-xs w-full">
            {/* Fake meal card */}
            <div className="bg-card/95 rounded-lg p-4 border-2 border-primary shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🥗</span>
                <div>
                  <div className="font-medium text-sm">Lunch</div>
                  <div className="text-xs text-muted-foreground">Grilled Salmon Salad</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">450 cal · 35g protein</div>
            </div>
            {/* Swipe arrows */}
            <div className="flex justify-between mt-3 px-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>👈</span> Swap
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Recipe <span>👉</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom content card */}
        <div className="p-4 pb-20 md:pb-4">
          <div className="bg-card rounded-xl p-5 max-w-sm mx-auto shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Planner</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-4">
              <li>• <strong>Long-press days</strong> to generate or clear meals</li>
              <li>• <strong>Swipe cards:</strong> left to swap, right for recipe</li>
              <li>• <strong>Long-press a meal</strong> to exclude from shopping</li>
              <li className="flex items-center gap-1">• Tap <Printer className="h-3 w-3 inline" /> for printable recipes</li>
            </ul>
            <PageIndicators current={1} total={4} />
            <NavButtons
              isFirst={false}
              isLast={false}
              onPrev={handlePrev}
              onNext={handleNext}
              onSkip={handleSkip}
              isReplay={isReplay}
            />
          </div>
        </div>
      </div>
    )
  }

  // Page 2: Shopping List with bottom nav highlight
  if (currentPage === 2) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black/70">
        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-card rounded-xl p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Shopping List</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 mb-4">
              <li>• Tap <strong>"Update"</strong> after changing your meal plan</li>
              <li>• Check off items as you shop</li>
              <li>• Print your list for the store</li>
            </ul>
            <PageIndicators current={2} total={4} />
            <NavButtons
              isFirst={false}
              isLast={false}
              onPrev={handlePrev}
              onNext={handleNext}
              onSkip={handleSkip}
              isReplay={isReplay}
            />
          </div>
        </div>

        {/* Bottom nav highlight - mobile only visual */}
        <div className="md:hidden pb-4 px-4">
          <div className="bg-card/95 rounded-lg border-2 border-primary shadow-lg p-3">
            <div className="flex justify-around">
              {[
                { Icon: CalendarDays, label: 'Planner' },
                { Icon: ListChecks, label: 'Shopping', active: true },
                { Icon: Sparkles, label: 'Discover' },
                { Icon: Users, label: 'Users' },
                { Icon: Settings, label: 'Settings' },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center text-xs ${
                    item.active ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <item.Icon className={`h-5 w-5 ${item.active ? 'stroke-[2.5]' : ''}`} />
                  <span className="mt-1">{item.label}</span>
                </div>
              ))}
            </div>
            {/* Arrow pointing to Shopping (second item) */}
            <div className="flex justify-around mt-2">
              <div className="w-12" />
              <div className="w-12 flex justify-center">
                <span className="text-xl">👆</span>
              </div>
              <div className="w-12" />
              <div className="w-12" />
              <div className="w-12" />
            </div>
          </div>
        </div>
        <div className="h-16 md:h-0" /> {/* Spacer for actual bottom nav */}
      </div>
    )
  }

  // Page 3: Ready
  if (currentPage === 3) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 pb-20 md:pb-4">
        <div className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center mb-3">You're ready!</h2>
          <p className="text-muted-foreground text-sm text-center mb-2">
            Long-press today's date to generate your first meals.
          </p>
          <p className="text-muted-foreground text-xs text-center mb-6">
            You can replay this guide anytime in Settings.
          </p>
          <PageIndicators current={3} total={4} />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handlePrev} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              {isReplay ? 'Close' : 'Get Started'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function PageIndicators({ current, total }) {
  return (
    <div className="flex justify-center gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={`w-2 h-2 rounded-full transition-colors ${
            idx === current ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}

function NavButtons({ isFirst, isLast, onPrev, onNext, onSkip, isReplay }) {
  return (
    <div className="flex gap-2">
      {isFirst ? (
        <Button variant="ghost" onClick={onSkip} className="flex-1">
          Skip
        </Button>
      ) : (
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      <Button onClick={onNext} className="flex-1">
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
