'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { 
  getWeekStart, 
  getWeekDates, 
  formatWeekRange, 
  formatDayTab,
  formatDayHeader,
  isSameDay,
  toISODate
} from '@/lib/dates'
import { Loader2 } from 'lucide-react'

// Meal slots for the day (16:8 fasting window: 12:00-20:00)
const MEAL_SLOTS = [
  { id: 'lunch', label: 'Lunch', icon: '🥗', time: '12:00' },
  { id: 'afternoon_snack', label: 'Afternoon Snack', icon: '🍎', time: '15:00' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', time: '18:00' },
  { id: 'evening_snack', label: 'Evening Snack', icon: '🫐', time: '19:30' },
]

// Transform API meal to our UI format
function transformMeal(apiMeal, slot, date, servings) {
  return {
    name: apiMeal.name,
    description: apiMeal.description,
    slot: slot,
    date: date,
    servings: apiMeal.serves || servings,
    prepTime: apiMeal.prep_time_mins,
    cookTime: apiMeal.cook_time_mins,
    // Flatten per_serve macros for easier access
    calories: apiMeal.per_serve?.calories || 0,
    protein: apiMeal.per_serve?.protein_g || 0,
    fat: apiMeal.per_serve?.fat_g || 0,
    carbs: apiMeal.per_serve?.carbs_g || 0,
    // Transform ingredients: { id, name, grams } → { quantity, unit, name }
    ingredients: (apiMeal.ingredients || []).map(ing => ({
      name: ing.name,
      quantity: ing.grams,
      unit: 'g'
    })),
    // Keep instructions as-is (string with \n)
    instructions: apiMeal.instructions,
  }
}

export default function WeekView({ weekOffset = 0 }) {
  const { user, targets } = useUser()
  
  // Calculate week dates
  const today = new Date()
  const weekStart = useMemo(() => {
    const start = getWeekStart(today)
    start.setDate(start.getDate() + (weekOffset * 7))
    return start
  }, [weekOffset])
  
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  
  // State
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today if in this week, otherwise Monday
    if (weekOffset === 0) {
      return today
    }
    return weekStart
  })
  const [meals, setMeals] = useState({}) // keyed by ISO date, then slot
  const [isGenerating, setIsGenerating] = useState(false)
  const [servings, setServings] = useState(2)
  
  // Get meals for selected day
  const selectedDateKey = toISODate(selectedDate)
  const dayMeals = meals[selectedDateKey] || {}
  
  // Calculate day totals
  const dayTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 }
    Object.values(dayMeals).forEach(meal => {
      if (meal) {
        totals.calories += meal.calories || 0
        totals.protein += meal.protein || 0
        totals.fat += meal.fat || 0
        totals.carbs += meal.carbs || 0
      }
    })
    return totals
  }, [dayMeals])

  // Generate meals for the SELECTED DAY (not whole week - more reliable)
  const handleGenerate = async () => {
    if (!user) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraints: '', // Could add user constraints here
          serves: servings,
          mealCount: 4, // 4 meals for the day
          userTargets: targets,
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.meals) {
        // Assign meals to the selected day's slots
        const dateKey = toISODate(selectedDate)
        const dayMeals = {}
        
        MEAL_SLOTS.forEach((slot, index) => {
          if (index < data.meals.length) {
            dayMeals[slot.id] = transformMeal(
              data.meals[index],
              slot.id,
              dateKey,
              servings
            )
          }
        })
        
        // Merge with existing meals (preserves other days)
        setMeals(prev => ({
          ...prev,
          [dateKey]: dayMeals
        }))
      } else if (data.error) {
        console.error('API error:', data.error)
        alert('Failed to generate meals. Try again.')
      }
    } catch (error) {
      console.error('Failed to generate meals:', error)
      alert('Failed to generate meals. Check console for details.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex-1 p-6">
      {/* Week Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {weekOffset === 0 ? 'This Week' : 'Next Week'}
          </h1>
          <p className="text-muted-foreground">
            {formatWeekRange(weekStart)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value={1}>1 serving</option>
            <option value={2}>2 servings</option>
            <option value={4}>4 servings</option>
          </select>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !user}
            className="min-w-[140px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Day'
            )}
          </Button>
        </div>
      </div>
      
      {/* Day Strip */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {weekDates.map(date => {
          const isSelected = isSameDay(date, selectedDate)
          const isToday = isSameDay(date, today)
          const dateKey = toISODate(date)
          const hasMeals = meals[dateKey] && Object.keys(meals[dateKey]).length > 0
          
          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDate(date)}
              className={`flex-1 py-3 px-2 rounded-lg text-center transition-colors ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : isToday
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'hover:bg-accent'
              }`}
            >
              <div className="text-sm font-medium">{formatDayTab(date)}</div>
              {hasMeals && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {Object.keys(meals[dateKey]).length} meals
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Day Detail */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{formatDayHeader(selectedDate)}</h2>
        
        {/* Meal Slots */}
        <div className="space-y-4">
          {MEAL_SLOTS.map(slot => {
            const meal = dayMeals[slot.id]
            
            return (
              <MealSlotCard 
                key={slot.id}
                slot={slot}
                meal={meal}
              />
            )
          })}
        </div>
        
        {/* Day Totals */}
        {Object.keys(dayMeals).length > 0 && targets && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Day Totals</h3>
            <div className="grid grid-cols-4 gap-4">
              <MacroProgress 
                label="Calories" 
                current={dayTotals.calories} 
                target={targets.dailyCalories}
              />
              <MacroProgress 
                label="Protein" 
                current={dayTotals.protein} 
                target={targets.protein}
                unit="g"
              />
              <MacroProgress 
                label="Fat" 
                current={dayTotals.fat} 
                target={targets.fat}
                unit="g"
              />
              <MacroProgress 
                label="Carbs" 
                current={dayTotals.carbs} 
                target={targets.carbs}
                unit="g"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-component: Meal slot card
function MealSlotCard({ slot, meal }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!meal) {
    return (
      <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground">
        <span className="text-xl mr-2">{slot.icon}</span>
        <span className="text-sm">{slot.label} - Not planned</span>
      </div>
    )
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span>{slot.icon}</span>
              <span className="uppercase tracking-wide">{slot.label}</span>
              <span>• {slot.time}</span>
            </div>
            <h3 className="font-medium">{meal.name}</h3>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">{meal.calories} cal</div>
            <div className="text-xs text-muted-foreground">
              {meal.protein}g P • {meal.fat}g F • {meal.carbs}g C
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-primary hover:underline"
        >
          {isExpanded ? 'Hide recipe ▲' : 'View recipe ▼'}
        </button>
      </div>
      
      {/* Expanded Recipe */}
      {isExpanded && (
        <div className="p-4 bg-muted/30 border-t space-y-4">
          {/* Ingredients */}
          <div>
            <h4 className="text-sm font-medium mb-2">
              Ingredients ({meal.servings || 1} serving{(meal.servings || 1) > 1 ? 's' : ''})
            </h4>
            <ul className="text-sm space-y-1">
              {meal.ingredients?.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{ing.quantity}{ing.unit}</span>
                  <span>{ing.name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Instructions */}
          <div>
            <h4 className="text-sm font-medium mb-2">Instructions</h4>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              {(typeof meal.instructions === 'string' 
                ? meal.instructions.split('\n').filter(Boolean)
                : meal.instructions || []
              ).map((step, i) => (
                <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component: Macro progress bar
function MacroProgress({ label, current, target, unit = '' }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isOver = current > target
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={isOver ? 'text-amber-600 font-medium' : ''}>
          {Math.round(current)}{unit} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${isOver ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
