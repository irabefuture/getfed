/**
 * Meal planning logic - selects recipes from library
 * 
 * MVP: Simple rules-based selection
 * Future: AI-powered selection considering preferences, ratings, history
 */

import { getAllRecipes, getFilteredRecipes } from './recipes'

/**
 * Select a meal for a specific slot from the library
 * @param {string} slotType - 'lunch', 'dinner', 'snack_afternoon', 'snack_evening'
 * @param {Array} excludeIds - Recipe IDs to avoid (already used this week)
 * @param {Object} preferences - User preferences (dietary restrictions, etc.)
 * @returns {Object|null} Selected recipe or null if none available
 */
export function selectMealForSlot(slotType, excludeIds = [], preferences = {}) {
  // Map slot types to meal_type values in recipes
  const mealTypeMap = {
    'lunch': ['lunch', 'dinner'], // Lunch can use lunch or dinner recipes
    'dinner': ['dinner', 'lunch'], // Dinner can use dinner or lunch recipes  
    'snack_afternoon': ['snack_afternoon', 'snack_evening'],
    'snack_evening': ['snack_evening', 'snack_afternoon'],
  }
  
  const allowedTypes = mealTypeMap[slotType] || [slotType]
  
  // Get all recipes and filter
  const allRecipes = getAllRecipes()
  
  let candidates = allRecipes.filter(recipe => {
    // Must match meal type
    if (!allowedTypes.includes(recipe.meal_type)) return false
    
    // Exclude already-used recipes
    if (excludeIds.includes(recipe.id)) return false
    
    // Apply dietary filters if specified
    if (preferences.dairyFree && !recipe.dietary?.dairy_free) return false
    if (preferences.glutenFree && !recipe.dietary?.gluten_free) return false
    if (preferences.nutFree && !recipe.dietary?.nut_free) return false
    if (preferences.vegetarian && !recipe.dietary?.vegetarian) return false
    
    return true
  })
  
  // If no candidates after filtering, relax the exclusion rule
  if (candidates.length === 0) {
    candidates = allRecipes.filter(recipe => {
      if (!allowedTypes.includes(recipe.meal_type)) return false
      if (preferences.dairyFree && !recipe.dietary?.dairy_free) return false
      if (preferences.glutenFree && !recipe.dietary?.gluten_free) return false
      if (preferences.nutFree && !recipe.dietary?.nut_free) return false
      if (preferences.vegetarian && !recipe.dietary?.vegetarian) return false
      return true
    })
  }
  
  if (candidates.length === 0) return null
  
  // Random selection (MVP) - could be smarter later
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}

/**
 * Generate a full day of meals
 * @param {Array} excludeIds - Recipe IDs to avoid
 * @param {Object} preferences - User dietary preferences
 * @returns {Object} Meals keyed by slot ID
 */
export function generateDayMeals(excludeIds = [], preferences = {}) {
  const slots = ['lunch', 'snack_afternoon', 'dinner', 'snack_evening']
  const dayMeals = {}
  const usedInDay = [...excludeIds]
  
  for (const slot of slots) {
    const recipe = selectMealForSlot(slot, usedInDay, preferences)
    if (recipe) {
      dayMeals[slot] = recipe
      usedInDay.push(recipe.id)
    }
  }
  
  return dayMeals
}

/**
 * Generate a full week of meals
 * @param {Object} preferences - User dietary preferences
 * @returns {Object} Meals keyed by day index (0-6), then slot ID
 */
export function generateWeekMeals(preferences = {}) {
  const weekMeals = {}
  const usedThisWeek = []
  
  for (let day = 0; day < 7; day++) {
    const dayMeals = generateDayMeals(usedThisWeek, preferences)
    weekMeals[day] = dayMeals
    
    // Track used recipes to avoid repeats
    Object.values(dayMeals).forEach(recipe => {
      if (recipe && !usedThisWeek.includes(recipe.id)) {
        usedThisWeek.push(recipe.id)
      }
    })
  }
  
  return weekMeals
}

/**
 * Get alternative recipes for a slot (for swapping)
 * @param {string} slotType - The meal slot type
 * @param {string} currentRecipeId - Current recipe to exclude from alternatives
 * @param {Array} excludeIds - Other recipes to exclude
 * @param {Object} preferences - User dietary preferences
 * @returns {Array} Array of alternative recipes
 */
export function getAlternativesForSlot(slotType, currentRecipeId, excludeIds = [], preferences = {}) {
  const mealTypeMap = {
    'lunch': ['lunch', 'dinner'],
    'dinner': ['dinner', 'lunch'],
    'snack_afternoon': ['snack_afternoon', 'snack_evening'],
    'snack_evening': ['snack_evening', 'snack_afternoon'],
  }
  
  const allowedTypes = mealTypeMap[slotType] || [slotType]
  const allRecipes = getAllRecipes()
  
  return allRecipes.filter(recipe => {
    if (!allowedTypes.includes(recipe.meal_type)) return false
    if (recipe.id === currentRecipeId) return false
    if (excludeIds.includes(recipe.id)) return false
    
    if (preferences.dairyFree && !recipe.dietary?.dairy_free) return false
    if (preferences.glutenFree && !recipe.dietary?.gluten_free) return false
    if (preferences.nutFree && !recipe.dietary?.nut_free) return false
    if (preferences.vegetarian && !recipe.dietary?.vegetarian) return false
    
    return true
  })
}
