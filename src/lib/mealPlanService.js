/**
 * Meal Plan Service - Supabase persistence for meal plans
 * Handles CRUD operations for planned_meals table
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

      // Transform row to app meal format
      meals[dateKey][row.meal_type] = {
        id: row.recipe_id || row.id,
        name: row.name,
        prepTime: row.prep_time_mins,
        cookTime: row.cook_time_mins,
        serves: row.cooking_serves,
        ingredients: row.ingredients_json || [],
        macros: {
          protein: row.protein_g,
          fat: row.fat_g,
          carbs: row.carbs_g,
          calories: row.calories
        },
        instructions: row.instructions
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
 * Save a single meal (upsert)
 * @param {string} householdId - Household UUID
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @param {string} slotId - Meal slot (lunch, dinner, etc.)
 * @param {Object} meal - Meal data
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function saveMeal(householdId, date, slotId, meal) {
  try {
    const row = {
      household_id: householdId,
      date: date,
      meal_type: slotId,
      recipe_id: meal.id || null,
      name: meal.name,
      prep_time_mins: meal.prepTime || null,
      cook_time_mins: meal.cookTime || null,
      cooking_serves: meal.serves || 2,
      ingredients_json: meal.ingredients || [],
      protein_g: meal.macros?.protein || 0,
      fat_g: meal.macros?.fat || 0,
      carbs_g: meal.macros?.carbs || 0,
      calories: meal.macros?.calories || 0,
      instructions: meal.instructions || null,
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
    const rows = Object.entries(dayMeals).map(([slotId, meal]) => ({
      household_id: householdId,
      date: date,
      meal_type: slotId,
      recipe_id: meal.id || null,
      name: meal.name,
      prep_time_mins: meal.prepTime || null,
      cook_time_mins: meal.cookTime || null,
      cooking_serves: meal.serves || 2,
      ingredients_json: meal.ingredients || [],
      protein_g: meal.macros?.protein || 0,
      fat_g: meal.macros?.fat || 0,
      carbs_g: meal.macros?.carbs || 0,
      calories: meal.macros?.calories || 0,
      instructions: meal.instructions || null,
      excluded: false,
      status: 'planned',
      source: 'ai_generated'
    }))

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
      .select('date, meal_type, name, ingredients_json, cooking_serves')
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
      meals[dateKey][row.meal_type] = {
        name: row.name,
        ingredients: row.ingredients_json || [],
        serves: row.cooking_serves
      }
    })

    return { meals, error: null }
  } catch (error) {
    console.error('Failed to fetch meals for shopping:', error)
    return { meals: {}, error }
  }
}
