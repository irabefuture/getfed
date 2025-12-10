/**
 * Recipe Ratings - Supabase operations for recipe likes/dislikes
 *
 * Used to personalise meal suggestions:
 * - Liked recipes: May be suggested more often (future feature)
 * - Disliked recipes: Never suggested again
 */

import { supabase } from './supabase'

/**
 * Get a user's rating for a specific recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<string|null>} 'liked', 'disliked', or null
 */
export async function getRecipeRating(userId, recipeId) {
  if (!userId || !recipeId) return null

  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (not an error for our use case)
    console.error('Error fetching recipe rating:', error)
  }

  return data?.rating || null
}

/**
 * Set or update a user's rating for a recipe
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @param {string} rating - 'liked' or 'disliked'
 * @returns {Promise<boolean>} Success status
 */
export async function setRecipeRating(userId, recipeId, rating) {
  if (!userId || !recipeId || !rating) {
    console.error('Missing required params for setRecipeRating')
    return false
  }

  if (!['liked', 'disliked'].includes(rating)) {
    console.error('Invalid rating value:', rating)
    return false
  }

  const { error } = await supabase
    .from('recipe_ratings')
    .upsert({
      user_id: userId,
      recipe_id: recipeId,
      rating: rating,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,recipe_id',
    })

  if (error) {
    console.error('Error saving recipe rating:', error)
    return false
  }

  return true
}

/**
 * Remove a user's rating for a recipe (clear/unrate)
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeRecipeRating(userId, recipeId) {
  if (!userId || !recipeId) return false

  const { error } = await supabase
    .from('recipe_ratings')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)

  if (error) {
    console.error('Error removing recipe rating:', error)
    return false
  }

  return true
}

// Alias for clarity
export const clearRecipeRating = removeRecipeRating

/**
 * Get all disliked recipe IDs for a user
 * Used to filter recipes during meal generation
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of disliked recipe IDs
 */
export async function getDislikedRecipeIds(userId) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('recipe_id')
    .eq('user_id', userId)
    .eq('rating', 'disliked')

  if (error) {
    console.error('Error fetching disliked recipes:', error)
    return []
  }

  return (data || []).map(r => r.recipe_id)
}

/**
 * Get all liked recipe IDs for a user
 * Could be used for "favorites" feature or weighted selection
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of liked recipe IDs
 */
export async function getLikedRecipeIds(userId) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('recipe_id')
    .eq('user_id', userId)
    .eq('rating', 'liked')

  if (error) {
    console.error('Error fetching liked recipes:', error)
    return []
  }

  return (data || []).map(r => r.recipe_id)
}

/**
 * Get all ratings for a user (for bulk loading)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Map of recipeId -> rating
 */
export async function getAllRatings(userId) {
  if (!userId) return {}

  const { data, error } = await supabase
    .from('recipe_ratings')
    .select('recipe_id, rating')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching all ratings:', error)
    return {}
  }

  const ratings = {}
  for (const r of data || []) {
    ratings[r.recipe_id] = r.rating
  }
  return ratings
}
