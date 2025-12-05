/**
 * Recipe loading and filtering utilities
 * 
 * Loads recipes from JSON files extracted from Galveston Diet book
 * 90 recipes total across all categories
 */

// Import all recipe files
import lunchMains from '../../data/recipes/lunch-mains.json'
import dinnerMains from '../../data/recipes/dinner-mains.json'
import snacksAfternoon from '../../data/recipes/snacks-afternoon.json'
import snacksEvening from '../../data/recipes/snacks-evening.json'
import smoothies from '../../data/recipes/smoothies.json'
import breakfast from '../../data/recipes/breakfast.json'

/**
 * Get all recipes from all sources
 * @returns {Array} Combined array of all recipes
 */
export function getAllRecipes() {
  const allRecipes = [
    ...(lunchMains.recipes || []),
    ...(dinnerMains.recipes || []),
    ...(snacksAfternoon.recipes || []),
    ...(snacksEvening.recipes || []),
    ...(smoothies.recipes || []),
    ...(breakfast.recipes || []),
  ]
  return allRecipes
}

/**
 * Get recipes filtered by criteria
 * @param {Object} filters - Filter criteria
 * @param {string} filters.mealType - 'lunch', 'dinner', 'snack_afternoon', 'snack_evening', or null for all
 * @param {string} filters.category - Category like 'fish', 'poultry', etc. or null for all
 * @param {number} filters.maxTime - Maximum total time in minutes, or null for any
 * @param {Object} filters.dietary - { dairyFree, glutenFree, nutFree, vegetarian, vegan }
 * @param {string} filters.search - Search text for name/description
 * @returns {Array} Filtered recipes
 */
export function getFilteredRecipes(filters = {}) {
  let recipes = getAllRecipes()
  
  const { mealType, category, maxTime, dietary = {}, search } = filters
  
  // Filter by meal type
  if (mealType && mealType !== 'all') {
    // Handle grouped types (e.g., 'snack' matches both snack_afternoon and snack_evening)
    if (mealType === 'snack') {
      recipes = recipes.filter(r => 
        r.meal_type === 'snack_afternoon' || r.meal_type === 'snack_evening'
      )
    } else {
      recipes = recipes.filter(r => r.meal_type === mealType)
    }
  }
  
  // Filter by category
  if (category && category !== 'all') {
    recipes = recipes.filter(r => r.category === category)
  }
  
  // Filter by max time
  if (maxTime) {
    recipes = recipes.filter(r => r.total_time_mins <= maxTime)
  }
  
  // Filter by dietary requirements
  if (dietary.dairyFree) {
    recipes = recipes.filter(r => r.dietary?.dairy_free === true)
  }
  if (dietary.glutenFree) {
    recipes = recipes.filter(r => r.dietary?.gluten_free === true)
  }
  if (dietary.nutFree) {
    recipes = recipes.filter(r => r.dietary?.nut_free === true)
  }
  if (dietary.vegetarian) {
    recipes = recipes.filter(r => r.dietary?.vegetarian === true)
  }
  if (dietary.vegan) {
    recipes = recipes.filter(r => r.dietary?.vegan === true)
  }
  
  // Filter by search text
  if (search && search.trim()) {
    const searchLower = search.toLowerCase().trim()
    recipes = recipes.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower) ||
      r.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }
  
  return recipes
}

/**
 * Get unique categories from all recipes
 * @returns {Array} Sorted array of category strings
 */
export function getCategories() {
  const recipes = getAllRecipes()
  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))]
  return categories.sort()
}

/**
 * Get a single recipe by ID
 * @param {string} id - Recipe ID
 * @returns {Object|null} Recipe object or null if not found
 */
export function getRecipeById(id) {
  const recipes = getAllRecipes()
  return recipes.find(r => r.id === id) || null
}

/**
 * Format meal type for display
 * @param {string} mealType - Raw meal type from schema
 * @returns {string} Human-readable meal type
 */
export function formatMealType(mealType) {
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack_afternoon: 'Afternoon Snack',
    snack_evening: 'Evening Snack',
  }
  return labels[mealType] || mealType
}

/**
 * Format category for display
 * @param {string} category - Raw category from schema
 * @returns {string} Human-readable category
 */
export function formatCategory(category) {
  const labels = {
    fish: 'Fish',
    shellfish: 'Shellfish',
    poultry: 'Poultry',
    beef: 'Beef',
    lamb: 'Lamb',
    pork: 'Pork',
    eggs: 'Eggs',
    dairy: 'Dairy',
    legumes: 'Legumes',
    nuts_seeds: 'Nuts & Seeds',
    tofu_tempeh: 'Tofu/Tempeh',
    grains: 'Grains',
    fruit: 'Fruit',
    starchy_veg: 'Starchy Veg',
    vegetables: 'Vegetables',
    leafy_greens: 'Leafy Greens',
    cruciferous: 'Cruciferous',
    fats_oils: 'Fats & Oils',
    sweets: 'Sweets',
    smoothie: 'Smoothie',
    hot_beverage: 'Hot Beverage',
    cold_beverage: 'Cold Beverage',
  }
  return labels[category] || category
}

/**
 * Get recipe count by meal type
 * @returns {Object} Counts keyed by meal type
 */
export function getRecipeCountsByType() {
  const recipes = getAllRecipes()
  const counts = {}
  
  recipes.forEach(r => {
    const type = r.meal_type || 'other'
    counts[type] = (counts[type] || 0) + 1
  })
  
  return counts
}
