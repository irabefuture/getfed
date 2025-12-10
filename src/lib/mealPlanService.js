/**
 * Meal Plan Service - Supabase persistence for meal plans
 * Handles CRUD operations for planned_meals table
 *
 * IMPORTANT: Stores complete recipe objects in recipe_json column
 * to preserve all fields needed by components (base_servings, per_serve, etc.)
 */

import { supabase } from './supabase'

/**
 * Fetch meal plan for a date range
 * @param {string} householdId - Household UUID
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} endDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<{meals: Object, excludedMeals: string[], error: Error|null}>}
 */
export async function fetchMealPlan(householdId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('planned_meals')
      .select('*')
      .eq('household_id', householdId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Transform from rows to nested object structure
    // { "2025-12-09": { "lunch": {...}, "dinner": {...} } }
    const meals = {}
    const excludedMeals = []

    data.forEach(row => {
      const dateKey = row.date
      if (!meals[dateKey]) {
        meals[dateKey] = {}
      }

      // FIXED: Use recipe_json if available (preserves full recipe structure)
      // Fall back to reconstructing from individual columns for backward compatibility
      if (row.recipe_json) {
        meals[dateKey][row.meal_type] = row.recipe_json
      } else {
        // Legacy fallback: reconstruct from individual columns
        // This handles data saved before the recipe_json column was added
        meals[dateKey][row.meal_type] = {
          id: row.recipe_id || row.id,
          name: row.name,
          description: row.description || '',
          prep_time_mins: row.prep_time_mins,
          cook_time_mins: row.cook_time_mins,
          total_time_mins: (row.prep_time_mins || 0) + (row.cook_time_mins || 0),
          base_servings: row.cooking_serves || 2,
          ingredients: row.ingredients_json || [],
          per_serve: {
            calories: row.calories || 0,
            protein_g: row.protein_g || 0,
            fat_g: row.fat_g || 0,
            carbs_g: row.carbs_g || 0
          },
          instructions: row.instructions ?
            (Array.isArray(row.instructions) ? row.instructions : [row.instructions]) : [],
          batch_notes: row.batch_notes || ''
        }
      }

      // Track excluded meals
      if (row.excluded) {
        excludedMeals.push(`${dateKey}-${row.meal_type}`)
      }
    })

    return { meals, excludedMeals, error: null }
  } catch (error) {
    console.error('Failed to fetch meal plan:', error)
    return { meals: {}, excludedMeals: [], error }
  }
}

/**
 * Extract flat fields from recipe for database columns (for indexing/queries)
 * @param {Object} meal - Recipe object
 * @returns {Object} Flat fields for database columns
 */
function extractMealFields(meal) {
  return {
    recipe_id: meal.id || null,
    name: meal.name || 'Unnamed meal',
    description: meal.description || null,
    prep_time_mins: meal.prep_time_mins || meal.prepTime || null,
    cook_time_mins: meal.cook_time_mins || meal.cookTime || null,
    cooking_serves: meal.base_servings || meal.serves || 2,
    ingredients_json: meal.ingredients || [],
    protein_g: meal.per_serve?.protein_g || meal.macros?.protein || 0,
    fat_g: meal.per_serve?.fat_g || meal.macros?.fat || 0,
    carbs_g: meal.per_serve?.carbs_g || meal.macros?.carbs || 0,
    calories: meal.per_serve?.calories || meal.macros?.calories || 0,
    instructions: meal.instructions || null,
    batch_notes: meal.batch_notes || null
  }
}

/**
 * Save a single meal (upsert)
 * @param {string} householdId - Household UUID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} slotId - Meal slot (lunch, dinner, etc.)
 * @param {Object} meal - Meal data (complete recipe object)
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveMeal(householdId, date, slotId, meal) {
  try {
    const flatFields = extractMealFields(meal)

    const row = {
      household_id: householdId,
      date: date,
      meal_type: slotId,
      ...flatFields,
      // CRITICAL: Store complete recipe object to preserve all fields
      recipe_json: meal,
      excluded: false,
      status: 'planned',
      source: 'ai_generated'
    }

    const { error } = await supabase
      .from('planned_meals')
      .upsert(row, {
        onConflict: 'household_id,date,meal_type',
        ignoreDuplicates: false
      })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to save meal:', error)
    return { success: false, error }
  }
}

/**
 * Save all meals for a single day (batch upsert)
 * @param {string} householdId - Household UUID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {Object} dayMeals - Object of { slotId: meal }
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveDayMeals(householdId, date, dayMeals) {
  try {
    const rows = Object.entries(dayMeals).map(([slotId, meal]) => {
      const flatFields = extractMealFields(meal)

      return {
        household_id: householdId,
        date: date,
        meal_type: slotId,
        ...flatFields,
        // CRITICAL: Store complete recipe object to preserve all fields
        recipe_json: meal,
        excluded: false,
        status: 'planned',
        source: 'ai_generated'
      }
    })

    if (rows.length === 0) return { success: true, error: null }

    const { error } = await supabase
      .from('planned_meals')
      .upsert(rows, {
        onConflict: 'household_id,date,meal_type',
        ignoreDuplicates: false
      })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to save day meals:', error)
    return { success: false, error }
  }
}

/**
 * Toggle meal exclusion from shopping list
 * @param {string} householdId - Household UUID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} slotId - Meal slot
 * @param {boolean} excluded - New exclusion state
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function setMealExclusion(householdId, date, slotId, excluded) {
  try {
    const { error } = await supabase
      .from('planned_meals')
      .update({ excluded })
      .eq('household_id', householdId)
      .eq('date', date)
      .eq('meal_type', slotId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to set meal exclusion:', error)
    return { success: false, error }
  }
}

/**
 * Delete a meal from the plan
 * @param {string} householdId - Household UUID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} slotId - Meal slot
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteMeal(householdId, date, slotId) {
  try {
    const { error } = await supabase
      .from('planned_meals')
      .delete()
      .eq('household_id', householdId)
      .eq('date', date)
      .eq('meal_type', slotId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Failed to delete meal:', error)
    return { success: false, error }
  }
}

/**
 * Fetch meals for shopping list (non-excluded only)
 * @param {string} householdId - Household UUID
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} endDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<{meals: Object, error: Error|null}>}
 */
export async function fetchMealsForShopping(householdId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('planned_meals')
      .select('date, meal_type, name, ingredients_json, cooking_serves, recipe_json')
      .eq('household_id', householdId)
      .eq('excluded', false)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Transform to meals object format expected by shopping list
    const meals = {}
    data.forEach(row => {
      const dateKey = row.date
      if (!meals[dateKey]) {
        meals[dateKey] = {}
      }

      // FIXED: Use recipe_json if available, otherwise reconstruct
      if (row.recipe_json) {
        meals[dateKey][row.meal_type] = row.recipe_json
      } else {
        meals[dateKey][row.meal_type] = {
          name: row.name,
          ingredients: row.ingredients_json || [],
          base_servings: row.cooking_serves || 2
        }
      }
    })

    return { meals, error: null }
  } catch (error) {
    console.error('Failed to fetch meals for shopping:', error)
    return { meals: {}, error }
  }
}
