'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import RecipeCard from '@/components/RecipeCard'
import { getFilteredRecipes, getCategories, formatCategory } from '@/lib/recipes'
import { Search, SlidersHorizontal, X } from 'lucide-react'

/**
 * RecipesView - Browse and filter all recipes
 */
export default function RecipesView() {
  // Filter state
  const [search, setSearch] = useState('')
  const [mealType, setMealType] = useState('all')
  const [category, setCategory] = useState('all')
  const [maxTime, setMaxTime] = useState(null)
  const [dietary, setDietary] = useState({
    dairyFree: false,
    glutenFree: false,
    nutFree: false,
    vegetarian: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Favourites (local state for now, will be Supabase later)
  const [favourites, setFavourites] = useState(new Set())
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false)
  
  // Get available categories from recipes
  const categories = useMemo(() => getCategories(), [])
  
  // Get filtered recipes
  const recipes = useMemo(() => {
    let filtered = getFilteredRecipes({
      search,
      mealType,
      category,
      maxTime,
      dietary,
    })
    
    // Filter to favourites only if enabled
    if (showFavouritesOnly) {
      filtered = filtered.filter(r => favourites.has(r.id))
    }
    
    return filtered
  }, [search, mealType, category, maxTime, dietary, showFavouritesOnly, favourites])
  
  // Toggle dietary filter
  const toggleDietary = (key) => {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  // Toggle favourite
  const toggleFavourite = (recipe) => {
    setFavourites(prev => {
      const next = new Set(prev)
      if (next.has(recipe.id)) {
        next.delete(recipe.id)
      } else {
        next.add(recipe.id)
      }
      return next
    })
  }
  
  // Count active filters
  const activeFilterCount = [
    mealType !== 'all',
    category !== 'all',
    maxTime !== null,
    dietary.dairyFree,
    dietary.glutenFree,
    dietary.nutFree,
    dietary.vegetarian,
    showFavouritesOnly,
  ].filter(Boolean).length
  
  return (
    <div className="flex-1 p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Recipes</h1>
        <p className="text-sm text-muted-foreground">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
        </p>
      </div>
      
      {/* Search + Filter Toggle (Mobile) */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`md:hidden px-3 py-2 border rounded-md flex items-center gap-1.5 ${
            showFilters ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="text-xs bg-primary-foreground text-primary rounded-full px-1.5">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
      
      {/* Filters - Always visible on desktop, toggle on mobile */}
      <div className={`bg-card rounded-lg border p-3 md:p-4 mb-4 md:mb-6 space-y-3 md:space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* Dropdowns row */}
        <div className="flex flex-wrap gap-3 md:gap-4">
          {/* Meal Type */}
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-medium">Type:</label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="text-sm border rounded-md px-2 py-1.5 bg-background min-h-[36px]"
            >
              <option value="all">All</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snacks</option>
              <option value="breakfast">Breakfast</option>
            </select>
          </div>
          
          {/* Category */}
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-medium">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm border rounded-md px-2 py-1.5 bg-background min-h-[36px]"
            >
              <option value="all">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{formatCategory(cat)}</option>
              ))}
            </select>
          </div>
          
          {/* Time */}
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-medium">Time:</label>
            <select
              value={maxTime || 'any'}
              onChange={(e) => setMaxTime(e.target.value === 'any' ? null : parseInt(e.target.value))}
              className="text-sm border rounded-md px-2 py-1.5 bg-background min-h-[36px]"
            >
              <option value="any">Any</option>
              <option value="10">≤10 min</option>
              <option value="15">≤15 min</option>
              <option value="30">≤30 min</option>
              <option value="45">≤45 min</option>
            </select>
          </div>
        </div>
        
        {/* Dietary checkboxes */}
        <div className="flex flex-wrap gap-3 md:gap-4">
          <label className="flex items-center gap-2 cursor-pointer min-h-[36px]">
            <Checkbox
              checked={dietary.dairyFree}
              onCheckedChange={() => toggleDietary('dairyFree')}
            />
            <span className="text-xs md:text-sm">Dairy-Free</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer min-h-[36px]">
            <Checkbox
              checked={dietary.glutenFree}
              onCheckedChange={() => toggleDietary('glutenFree')}
            />
            <span className="text-xs md:text-sm">Gluten-Free</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer min-h-[36px]">
            <Checkbox
              checked={dietary.nutFree}
              onCheckedChange={() => toggleDietary('nutFree')}
            />
            <span className="text-xs md:text-sm">Nut-Free</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer min-h-[36px]">
            <Checkbox
              checked={dietary.vegetarian}
              onCheckedChange={() => toggleDietary('vegetarian')}
            />
            <span className="text-xs md:text-sm">Vegetarian</span>
          </label>
          
          <span className="text-muted-foreground/30 hidden md:inline">|</span>
          
          <label className="flex items-center gap-2 cursor-pointer min-h-[36px]" title="Show favourites only">
            <Checkbox
              checked={showFavouritesOnly}
              onCheckedChange={() => setShowFavouritesOnly(!showFavouritesOnly)}
            />
            <span className="text-red-500">♥</span>
            <span className="text-xs md:text-sm md:hidden">Favourites</span>
          </label>
        </div>
        
        {/* Clear filters - mobile only when filters active */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setMealType('all')
              setCategory('all')
              setMaxTime(null)
              setDietary({ dairyFree: false, glutenFree: false, nutFree: false, vegetarian: false })
              setShowFavouritesOnly(false)
            }}
            className="text-xs text-primary hover:underline flex items-center gap-1 md:hidden"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
      
      {/* Recipe Grid */}
      {recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavourite={favourites.has(recipe.id)}
              onFavourite={toggleFavourite}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 md:py-12">
          <p className="text-muted-foreground text-sm">No recipes match your filters.</p>
          <button
            onClick={() => {
              setSearch('')
              setMealType('all')
              setCategory('all')
              setMaxTime(null)
              setDietary({ dairyFree: false, glutenFree: false, nutFree: false, vegetarian: false })
              setShowFavouritesOnly(false)
            }}
            className="text-primary hover:underline mt-2 text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
