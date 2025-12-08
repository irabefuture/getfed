'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatIngredientSimple } from '@/lib/ingredientFormat'

export default function MealCard({ meal, onAdd, onRegenerate, isAdded = false }) {
  const [showDetails, setShowDetails] = useState(false)
  
  // API returns: prep_time_mins, cook_time_mins, per_serve.calories, etc.
  const prepTime = meal.prep_time_mins || 0
  const cookTime = meal.cook_time_mins || 0
  const totalTime = prepTime + cookTime
  
  // Macros come from per_serve object
  const macros = meal.per_serve || {}
  const calories = macros.calories || 0
  const protein = macros.protein_g || 0
  const fat = macros.fat_g || 0
  const carbs = macros.carbs_g || 0
  
  // Instructions come as a string with \n separators, split into array
  const instructionSteps = typeof meal.instructions === 'string' 
    ? meal.instructions.split('\n').filter(step => step.trim())
    : (meal.instructions || [])
  
  return (
    <Card className={`transition-all ${isAdded ? 'ring-2 ring-primary bg-secondary/30' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {meal.name}
          </CardTitle>
          {isAdded && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Added
            </span>
          )}
        </div>
        
        {/* Meta row: time, serves */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {meal.serves}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Macros inline */}
        <div className="text-xs text-muted-foreground mb-3">
          {calories} cal · {protein}P · {fat}F · {carbs}C
          <span className="text-muted-foreground/60"> /serve</span>
        </div>
        
        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-primary hover:underline flex items-center gap-1 mb-2"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? 'Hide' : 'Show'} ingredients & steps
        </button>
        
        {showDetails && (
          <div className="text-xs space-y-3 mb-3 p-3 bg-muted/50 rounded">
            {/* Ingredients */}
            <div>
              <span className="font-medium block mb-1">Ingredients:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {meal.ingredients?.map((ing, i) => (
                  <li key={i}>
                    {formatIngredientSimple(ing.name, ing.grams)}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Instructions */}
            <div>
              <span className="font-medium block mb-1">Steps:</span>
              <ol className="list-decimal list-inside space-y-1">
                {instructionSteps.map((step, i) => (
                  <li key={i} className="leading-snug">{step.replace(/^\d+\.\s*/, '')}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {!isAdded ? (
            <Button size="sm" onClick={() => onAdd?.(meal)} className="flex-1">
              <Plus className="h-3 w-3 mr-1" />
              Add to Plan
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onAdd?.(meal)} className="flex-1">
              Remove
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onRegenerate?.(meal)}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
