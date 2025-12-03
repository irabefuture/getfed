'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Trash2 } from 'lucide-react'
import MealCard from './MealCard'

export default function MealPlanner() {
  const { user, targets } = useUser()
  
  // Form state
  const [constraints, setConstraints] = useState('')
  const [serves, setServes] = useState('2')
  const [mealCount, setMealCount] = useState('4')
  
  // Generation state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedMeals, setGeneratedMeals] = useState([])
  
  // Selected meals for the plan
  const [selectedMeals, setSelectedMeals] = useState([])

  const handleGenerate = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealCount: parseInt(mealCount),
          mealType: 'dinner',
          servings: parseInt(serves),
          constraints: constraints || undefined,
          userTargets: targets ? {
            calories: targets.dailyCalories,
            protein: targets.protein,
            fat: targets.fat,
            carbs: targets.carbs
          } : undefined
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setGeneratedMeals(data.meals || [])
      }
    } catch (err) {
      setError('Failed to generate meals. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = (meal) => {
    // Toggle: if already selected, remove it
    const isSelected = selectedMeals.some(m => m.name === meal.name)
    if (isSelected) {
      setSelectedMeals(selectedMeals.filter(m => m.name !== meal.name))
    } else {
      setSelectedMeals([...selectedMeals, meal])
    }
  }

  const handleRemoveMeal = (meal) => {
    setSelectedMeals(selectedMeals.filter(m => m.name !== meal.name))
  }

  const handleRegenerate = (meal) => {
    // TODO: Regenerate single meal
    console.log('Regenerate:', meal.name)
  }

  const isMealSelected = (meal) => {
    return selectedMeals.some(m => m.name === meal.name)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Generate Meals</h1>
        <p className="text-muted-foreground">
          Create meal ideas tailored to your targets
        </p>
      </div>
      
      {/* Generation Form */}
      <div className="bg-card border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Constraints */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium mb-1.5 block">
              Constraints (optional)
            </label>
            <Input
              placeholder="e.g., use the lamb in the fridge, no seafood today"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
          </div>
          
          {/* Serves */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Serves</label>
            <Select value={serves} onValueChange={setServes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 person</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="6">6 people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Meal Count */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">How many meals</label>
            <Select value={mealCount} onValueChange={setMealCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 meals</SelectItem>
                <SelectItem value="4">4 meals</SelectItem>
                <SelectItem value="6">6 meals</SelectItem>
                <SelectItem value="7">7 meals</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Generate Button */}
          <div className="flex items-end">
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !user}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${mealCount} Meal Ideas`
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            {error}
          </div>
        )}
      </div>
      
      {/* Generated Meals */}
      {generatedMeals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Generated Meals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedMeals.map((meal, index) => (
              <MealCard
                key={`${meal.name}-${index}`}
                meal={meal}
                onAdd={handleAddMeal}
                onRegenerate={handleRegenerate}
                isAdded={isMealSelected(meal)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Selected Meals Summary */}
      {selectedMeals.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Your Plan ({selectedMeals.length} meal{selectedMeals.length !== 1 ? 's' : ''})
          </h2>
          <ul className="space-y-2 mb-4">
            {selectedMeals.map((meal, index) => (
              <li 
                key={`selected-${meal.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/50 rounded"
              >
                <div>
                  <span className="font-medium">{meal.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {meal.per_serve?.calories || 0} cal · {(meal.prep_time_mins || 0) + (meal.cook_time_mins || 0)} min
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveMeal(meal)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
          <Button disabled className="w-full">
            Save Plan (coming soon)
          </Button>
        </div>
      )}
    </div>
  )
}
