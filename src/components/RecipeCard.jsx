'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Snowflake,
  Briefcase,
  Repeat,
  Heart,
} from 'lucide-react'
import { formatMealType, formatCategory } from '@/lib/recipes'

/**
 * RecipeCard - Browse/discovery focused recipe display
 * Shows dietary badges, batch/lunchbox indicators, expandable details
 */
export default function RecipeCard({ recipe, onFavourite, isFavourite = false }) {
  const [showDetails, setShowDetails] = useState(false)
  
  const totalTime = recipe.total_time_mins || 0
  const macros = recipe.per_serve || {}
  
  // Dietary badges to show
  const dietaryBadges = []
  if (recipe.dietary?.gluten_free) dietaryBadges.push({ label: 'GF', title: 'Gluten Free' })
  if (recipe.dietary?.dairy_free) dietaryBadges.push({ label: 'DF', title: 'Dairy Free' })
  if (recipe.dietary?.nut_free) dietaryBadges.push({ label: 'NF', title: 'Nut Free' })
  if (recipe.dietary?.vegetarian) dietaryBadges.push({ label: 'V', title: 'Vegetarian' })
  if (recipe.dietary?.vegan) dietaryBadges.push({ label: 'VG', title: 'Vegan' })
  
  // Feature indicators
  const features = []
  if (recipe.batch_friendly) features.push({ icon: Repeat, title: 'Batch Friendly' })
  if (recipe.good_for_lunchbox) features.push({ icon: Briefcase, title: 'Lunchbox Friendly' })
  if (recipe.freezer_friendly) features.push({ icon: Snowflake, title: 'Freezer Friendly' })
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold leading-tight">
              {recipe.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMealType(recipe.meal_type)} · {formatCategory(recipe.category)}
            </p>
          </div>
          
          {/* Favourite button */}
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 p-0 ${isFavourite ? 'text-red-500' : ''}`}
            onClick={() => onFavourite?.(recipe)}
          >
            <Heart className={`h-4 w-4 ${isFavourite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Description - full text, fixed height for uniformity */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[3.75rem]">
          {recipe.description}
        </p>
        
        {/* Time and Macros row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalTime} min
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>
            {macros.calories} cal · {macros.protein_g}P · {macros.fat_g}F · {macros.carbs_g}C
          </span>
        </div>
        
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {/* Dietary badges */}
          {dietaryBadges.map((badge) => (
            <span
              key={badge.label}
              title={badge.title}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary"
            >
              {badge.label}
            </span>
          ))}
          
          {/* Feature icons */}
          {features.map((feature, i) => (
            <span
              key={i}
              title={feature.title}
              className="text-muted-foreground"
            >
              <feature.icon className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
        
        {/* Spacer to push button to bottom */}
        <div className="flex-1" />
        
        {/* Expandable details */}
        {showDetails && (
          <div className="text-xs space-y-3 mb-3 p-3 bg-muted/50 rounded max-h-64 overflow-y-auto">
            {/* Ingredients */}
            <div>
              <span className="font-medium block mb-1">Ingredients:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i}>
                    {ing.name} ({ing.grams}g)
                    {ing.notes && <span className="text-muted-foreground"> - {ing.notes}</span>}
                    {ing.optional && <span className="text-muted-foreground"> (optional)</span>}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Instructions */}
            <div>
              <span className="font-medium block mb-1">Method:</span>
              <ol className="list-decimal list-inside space-y-1">
                {recipe.instructions?.map((step, i) => (
                  <li key={i} className="leading-snug">{step}</li>
                ))}
              </ol>
            </div>
            
            {/* Batch notes if available */}
            {recipe.batch_notes && (
              <div className="text-muted-foreground italic">
                💡 {recipe.batch_notes}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {/* View Recipe button - full width footer */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-3 bg-muted/50 hover:bg-muted transition-colors border-t flex items-center justify-center gap-2 text-sm font-medium text-primary"
      >
        {showDetails ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide Recipe
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            View Recipe
          </>
        )}
      </button>
    </Card>
  )
}
