/**
 * Smart Planner - AI-powered meal selection
 *
 * Uses Claude API to intelligently select recipes based on:
 * - Phase and macro targets
 * - Dietary restrictions
 * - Variety (protein rotation)
 * - User preferences
 *
 * Supports household mode where:
 * - Recipes are shared across all members
 * - Most restrictive phase/dietary requirements apply
 * - Individual portion sizes calculated per member
 */

import { getAllRecipes, getRecipeById } from './recipes'
import { MEAL_DISTRIBUTION, calculateMemberTargets } from '@/context/HouseholdContext'
import { getDislikedRecipeIds } from './recipeRatings'

/**
 * Generate a smart day of meals using AI
 * @param {Object} user - User object with current_phase, etc.
 * @param {Object} targets - { dailyCalories, protein, fat, carbs }
 * @param {Object} preferences - { dairyFree, glutenFree, batchFriendly, etc. }
 * @param {Array} excludeIds - Recipe IDs to avoid (recently used)
 * @param {Array} recentProteins - Protein categories used recently
 * @returns {Promise<Object>} Day plan with recipe objects
 */
export async function generateSmartDay(user, targets, preferences = {}, excludeIds = [], recentProteins = []) {
  const recipes = getAllRecipes()

  const response = await fetch('/api/generate-smart-meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipes,
      phase: user.current_phase || 'phase1',
      dailyCalories: targets?.dailyCalories || 2000,
      dailyProtein: targets?.protein || 100,
      dailyFat: targets?.fat || 150,
      dailyCarbs: targets?.carbs || 50,
      daysToGenerate: 1,
      dietary: {
        dairyFree: preferences.dairyFree || false,
        glutenFree: preferences.glutenFree || false,
        nutFree: preferences.nutFree || false,
        vegetarian: preferences.vegetarian || false,
      },
      preferences: {
        batchFriendly: preferences.batchFriendly || false,
        lunchboxFriendly: preferences.lunchboxFriendly || false,
      },
      excludeIds,
      recentProteins,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to generate meals')
  }

  const data = await response.json()

  if (!data.success || !data.plan || data.plan.length === 0) {
    throw new Error('No meal plan returned')
  }

  // Convert recipe IDs to full recipe objects
  const dayPlan = data.plan[0]
  const meals = {}

  for (const [slot, recipeId] of Object.entries(dayPlan.meals)) {
    if (recipeId) {
      const recipe = getRecipeById(recipeId)
      if (recipe) {
        meals[slot] = recipe
      }
    }
  }

  return {
    meals,
    dailyTotals: dayPlan.daily_totals,
    notes: dayPlan.notes,
    usage: data.usage,
  }
}

/**
 * Generate a smart week of meals using AI
 * @param {Object} user - User object with current_phase, id, etc.
 * @param {Object} targets - { dailyCalories, protein, fat, carbs }
 * @param {Object} preferences - Dietary and meal preferences
 * @returns {Promise<Object>} Week plan with recipe objects
 */
export async function generateSmartWeek(user, targets, preferences = {}) {
  const recipes = getAllRecipes()

  // Fetch user's disliked recipes to exclude from generation
  const dislikedIds = user?.id ? await getDislikedRecipeIds(user.id) : []

  // Combine explicit excludeIds with disliked recipes
  const allExcludeIds = [...new Set([
    ...(preferences.excludeIds || []),
    ...dislikedIds,
  ])]

  const response = await fetch('/api/generate-smart-meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipes,
      phase: user.current_phase || 'phase1',
      dailyCalories: targets?.dailyCalories || 2000,
      dailyProtein: targets?.protein || 100,
      dailyFat: targets?.fat || 150,
      dailyCarbs: targets?.carbs || 50,
      daysToGenerate: 7,
      dietary: {
        dairyFree: preferences.dairyFree || false,
        glutenFree: preferences.glutenFree || false,
        nutFree: preferences.nutFree || false,
        vegetarian: preferences.vegetarian || false,
      },
      preferences: {
        batchFriendly: preferences.batchFriendly || false,
        lunchboxFriendly: preferences.lunchboxFriendly || false,
      },
      excludeIds: allExcludeIds,
      recentProteins: preferences.recentProteins || [],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to generate week plan')
  }

  const data = await response.json()

  if (!data.success || !data.plan) {
    throw new Error('No meal plan returned')
  }

  // Convert all recipe IDs to full recipe objects
  const weekPlan = {}

  data.plan.forEach((dayPlan, index) => {
    const dayMeals = {}

    for (const [slot, recipeId] of Object.entries(dayPlan.meals || {})) {
      if (recipeId) {
        const recipe = getRecipeById(recipeId)
        if (recipe) {
          dayMeals[slot] = recipe
        }
      }
    }

    weekPlan[index] = {
      meals: dayMeals,
      dailyTotals: dayPlan.daily_totals,
      notes: dayPlan.notes,
    }
  })

  return {
    weekPlan,
    varietyNotes: data.variety_notes,
    invalidIds: data.invalid_ids || [],
    usage: data.usage,
  }
}

/**
 * Get the protein category from a recipe
 * @param {Object} recipe - Recipe object
 * @returns {string} Protein category
 */
export function getProteinCategory(recipe) {
  return recipe?.category || 'unknown'
}

/**
 * Extract protein categories from a day's meals
 * @param {Object} dayMeals - { lunch: recipe, dinner: recipe, ... }
 * @returns {Array} Array of protein categories used
 */
export function extractDayProteins(dayMeals) {
  const proteins = new Set()

  for (const recipe of Object.values(dayMeals)) {
    if (recipe?.category) {
      // Only count protein categories
      const proteinCategories = ['fish', 'shellfish', 'poultry', 'beef', 'lamb', 'pork', 'eggs', 'tofu_tempeh', 'legumes']
      if (proteinCategories.includes(recipe.category)) {
        proteins.add(recipe.category)
      }
    }
  }

  return [...proteins]
}

/**
 * Calculate daily totals from a day's meals
 * @param {Object} dayMeals - { lunch: recipe, dinner: recipe, ... }
 * @returns {Object} { calories, protein, fat, carbs }
 */
export function calculateDayTotals(dayMeals) {
  let calories = 0
  let protein = 0
  let fat = 0
  let carbs = 0

  for (const recipe of Object.values(dayMeals)) {
    if (recipe?.per_serve) {
      calories += recipe.per_serve.calories || 0
      protein += recipe.per_serve.protein_g || 0
      fat += recipe.per_serve.fat_g || 0
      carbs += recipe.per_serve.carbs_g || 0
    }
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  }
}

/**
 * Check if day's totals are within target range (10% tolerance)
 * @param {Object} totals - Actual day totals
 * @param {Object} targets - Target macros
 * @returns {Object} { withinRange, deviations }
 */
export function checkMacroCompliance(totals, targets) {
  const tolerance = 0.10 // 10%

  const checkValue = (actual, target, name) => {
    if (!target) return { withinRange: true, deviation: 0, name }
    const deviation = (actual - target) / target
    return {
      name,
      withinRange: Math.abs(deviation) <= tolerance,
      deviation: Math.round(deviation * 100),
      actual,
      target,
    }
  }

  const checks = [
    checkValue(totals.calories, targets.dailyCalories, 'calories'),
    checkValue(totals.protein, targets.protein, 'protein'),
    checkValue(totals.fat, targets.fat, 'fat'),
    checkValue(totals.carbs, targets.carbs, 'carbs'),
  ]

  return {
    withinRange: checks.every(c => c.withinRange),
    deviations: checks,
  }
}

/**
 * Get recipe IDs from a week plan (for exclusion in future generation)
 * @param {Object} weekPlan - Week plan object
 * @returns {Array} Array of recipe IDs used
 */
export function getUsedRecipeIds(weekPlan) {
  const ids = new Set()

  for (const day of Object.values(weekPlan)) {
    if (day.meals) {
      for (const recipe of Object.values(day.meals)) {
        if (recipe?.id) {
          ids.add(recipe.id)
        }
      }
    }
  }

  return [...ids]
}

// ============================================
// HOUSEHOLD MODE FUNCTIONS
// ============================================

/**
 * Generate a smart week for a household (shared meals)
 * Uses the most restrictive phase and combines dietary restrictions
 *
 * @param {Array} members - Array of household member objects
 * @param {Object} preferences - Shared preferences
 * @param {string} userId - User ID for fetching disliked recipes
 * @returns {Promise<Object>} Week plan with recipe objects
 */
export async function generateSmartWeekForHousehold(members, preferences = {}, userId = null) {
  if (!members || members.length === 0) {
    throw new Error('No household members provided')
  }

  const recipes = getAllRecipes()

  // Fetch user's disliked recipes to exclude from generation
  const dislikedIds = userId ? await getDislikedRecipeIds(userId) : []

  // Combine explicit excludeIds with disliked recipes
  const allExcludeIds = [...new Set([
    ...(preferences.excludeIds || []),
    ...dislikedIds,
  ])]

  // Get most restrictive phase (lowest number = strictest)
  const householdPhase = Math.min(...members.map(m => m.current_phase || 1))

  // Combine dietary restrictions (if ANY member has it, apply it)
  const combinedDietary = {
    dairyFree: members.some(m => m.dietary_restrictions?.dairy_free),
    glutenFree: members.some(m => m.dietary_restrictions?.gluten_free),
    nutFree: members.some(m => m.dietary_restrictions?.nut_free),
    vegetarian: members.some(m => m.dietary_restrictions?.vegetarian),
    vegan: members.some(m => m.dietary_restrictions?.vegan),
  }

  // Use primary member's targets for AI selection
  // (individual portions calculated after selection)
  const primaryMember = members.find(m => m.is_primary) || members[0]
  const targets = primaryMember.targets || calculateMemberTargets(primaryMember)

  const response = await fetch('/api/generate-smart-meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipes,
      phase: `phase${householdPhase}`,
      dailyCalories: targets.dailyCalories,
      dailyProtein: targets.protein,
      dailyFat: targets.fat,
      dailyCarbs: targets.carbs,
      daysToGenerate: 7,
      dietary: combinedDietary,
      preferences: {
        batchFriendly: preferences.batchFriendly || false,
        lunchboxFriendly: preferences.lunchboxFriendly || false,
      },
      excludeIds: allExcludeIds,
      recentProteins: preferences.recentProteins || [],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.details || error.error || 'Failed to generate week plan')
  }

  const data = await response.json()

  if (!data.success || !data.plan) {
    throw new Error('No meal plan returned')
  }

  // Convert recipe IDs to full objects
  const weekPlan = {}

  data.plan.forEach((dayPlan, index) => {
    const dayMeals = {}

    for (const [slot, recipeId] of Object.entries(dayPlan.meals || {})) {
      if (recipeId) {
        const recipe = getRecipeById(recipeId)
        if (recipe) {
          dayMeals[slot] = recipe
        }
      }
    }

    weekPlan[index] = {
      meals: dayMeals,
      dailyTotals: dayPlan.daily_totals,
      notes: dayPlan.notes,
    }
  })

  return {
    weekPlan,
    varietyNotes: data.variety_notes,
    invalidIds: data.invalid_ids || [],
    usage: data.usage,
    householdPhase,
    combinedDietary,
  }
}

/**
 * Calculate portion multiplier for a member given a recipe and meal type
 * @param {Object} member - Household member with targets
 * @param {Object} recipe - Recipe object with per_serve nutrition
 * @param {string} mealType - 'lunch', 'dinner', 'snack_afternoon', 'snack_evening'
 * @returns {number} Portion multiplier (e.g., 1.28 means 128% of base serving)
 */
export function calculateMemberPortion(member, recipe, mealType) {
  const targets = member.targets || calculateMemberTargets(member)
  const mealPercentage = MEAL_DISTRIBUTION[mealType] || 0.25

  // Target calories for this meal
  const targetCalories = targets.dailyCalories * mealPercentage

  // Recipe calories per serve
  const recipeCalories = recipe?.per_serve?.calories || 400

  // Portion multiplier
  const multiplier = targetCalories / recipeCalories

  // Clamp to reasonable range (0.5x to 2x)
  return Math.max(0.5, Math.min(2.0, multiplier))
}

/**
 * Calculate total shopping quantity for a recipe across all household members
 * @param {Array} members - Household members
 * @param {Object} recipe - Recipe with ingredients
 * @param {string} mealType - Meal type for portion calculation
 * @returns {number} Total portions to prepare (for shopping calculation)
 */
export function calculateHouseholdServings(members, recipe, mealType) {
  if (!members || members.length === 0) return 1

  return members.reduce((total, member) => {
    return total + calculateMemberPortion(member, recipe, mealType)
  }, 0)
}

/**
 * Calculate day totals for a specific member based on their portion sizes
 * @param {Object} dayMeals - { lunch: recipe, dinner: recipe, ... }
 * @param {Object} member - Household member
 * @returns {Object} { calories, protein, fat, carbs } adjusted for member's portions
 */
export function calculateMemberDayTotals(dayMeals, member) {
  let calories = 0
  let protein = 0
  let fat = 0
  let carbs = 0

  for (const [mealType, recipe] of Object.entries(dayMeals)) {
    if (recipe?.per_serve) {
      const portion = calculateMemberPortion(member, recipe, mealType)
      calories += (recipe.per_serve.calories || 0) * portion
      protein += (recipe.per_serve.protein_g || 0) * portion
      fat += (recipe.per_serve.fat_g || 0) * portion
      carbs += (recipe.per_serve.carbs_g || 0) * portion
    }
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  }
}

/**
 * Format portion as user-friendly string
 * @param {number} multiplier - Portion multiplier (e.g., 1.28)
 * @returns {string} User-friendly portion description
 */
export function formatPortion(multiplier) {
  if (multiplier < 0.6) return 'Small (~1/2)'
  if (multiplier < 0.85) return 'Light (~3/4)'
  if (multiplier < 1.15) return 'Regular'
  if (multiplier < 1.4) return 'Large (~1 1/4)'
  if (multiplier < 1.65) return 'Extra (~1 1/2)'
  return 'Double'
}
