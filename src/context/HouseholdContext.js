'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Household Context
 *
 * Manages multi-person meal planning where:
 * - Household shares meal plans (same recipes)
 * - Each member has individual nutrition targets
 * - Portion sizes calculated per member
 * - Shopping list aggregates all members' needs
 */

const HouseholdContext = createContext()

// Phase macro ratios from Galveston Diet
const PHASE_RATIOS = {
  1: { fat: 0.70, protein: 0.20, carbs: 0.10 },
  2: { fat: 0.55, protein: 0.20, carbs: 0.25 },
  3: { fat: 0.40, protein: 0.20, carbs: 0.40 },
}

// Activity multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

// Meal calorie distribution (intermittent fasting 16:8)
const MEAL_DISTRIBUTION = {
  lunch: 0.35,           // 35% of daily calories
  snack_afternoon: 0.10, // 10%
  dinner: 0.45,          // 45%
  snack_evening: 0.10,   // 10%
}

/**
 * Calculate nutrition targets for a member
 */
function calculateMemberTargets(member) {
  // BMR using Mifflin-St Jeor formula
  let bmr
  if (member.sex === 'male') {
    bmr = (10 * member.current_weight_kg) + (6.25 * member.height_cm) - (5 * member.age) + 5
  } else {
    bmr = (10 * member.current_weight_kg) + (6.25 * member.height_cm) - (5 * member.age) - 161
  }

  // TDEE = BMR * activity multiplier
  const activityMultiplier = ACTIVITY_MULTIPLIERS[member.activity_level] || 1.2
  const tdee = bmr * activityMultiplier

  // Calorie adjustment for weight goal
  let dailyCalories
  if (member.target_weight_kg < member.current_weight_kg) {
    // Weight loss: 500 calorie deficit
    dailyCalories = tdee - 500
  } else if (member.target_weight_kg > member.current_weight_kg) {
    // Weight gain: 300 calorie surplus
    dailyCalories = tdee + 300
  } else {
    // Maintenance
    dailyCalories = tdee
  }

  // Phase-based macro ratios
  const phase = member.current_phase || 1
  const ratios = PHASE_RATIOS[phase] || PHASE_RATIOS[1]

  return {
    dailyCalories: Math.round(dailyCalories),
    protein: Math.round((dailyCalories * ratios.protein) / 4), // 4 cal/g protein
    fat: Math.round((dailyCalories * ratios.fat) / 9),         // 9 cal/g fat
    carbs: Math.round((dailyCalories * ratios.carbs) / 4),     // 4 cal/g carbs
  }
}

/**
 * Calculate portion multiplier for a member given a recipe
 * Based on what percentage of their daily calories this meal should provide
 */
function calculatePortionMultiplier(member, recipe, mealType) {
  const targets = member.targets || calculateMemberTargets(member)
  const mealPercentage = MEAL_DISTRIBUTION[mealType] || 0.25

  // Target calories for this meal
  const targetCalories = targets.dailyCalories * mealPercentage

  // Recipe calories per serve
  const recipeCalories = recipe?.per_serve?.calories || 400

  // Portion multiplier: how many servings does this member need?
  const multiplier = targetCalories / recipeCalories

  // Clamp to reasonable range (0.5x to 2x)
  return Math.max(0.5, Math.min(2.0, multiplier))
}

/**
 * Calculate household shopping multiplier
 * Sums all members' portion multipliers for a recipe
 */
function calculateHouseholdMultiplier(members, recipe, mealType) {
  if (!members || members.length === 0) return 1

  return members.reduce((total, member) => {
    return total + calculatePortionMultiplier(member, recipe, mealType)
  }, 0)
}

export function HouseholdProvider({ children }) {
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [activeMember, setActiveMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch household data
  useEffect(() => {
    async function fetchHousehold() {
      try {
        // For MVP, use a hardcoded household ID or fetch based on user
        // In production, this would come from authentication
        const { data: households, error: householdsError } = await supabase
          .from('households')
          .select('*')
          .limit(1)

        if (householdsError) throw householdsError

        if (households && households.length > 0) {
          const householdData = households[0]
          setHousehold(householdData)

          // Fetch members for this household
          const { data: memberData, error: membersError } = await supabase
            .from('household_members')
            .select('*')
            .eq('household_id', householdData.id)
            .order('is_primary', { ascending: false })

          if (membersError) throw membersError

          // Calculate targets for each member
          const membersWithTargets = (memberData || []).map(member => ({
            ...member,
            targets: calculateMemberTargets(member),
          }))

          setMembers(membersWithTargets)

          // Set primary member as active by default
          const primary = membersWithTargets.find(m => m.is_primary)
          setActiveMember(primary || membersWithTargets[0] || null)
        }
      } catch (err) {
        console.error('Error fetching household:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHousehold()
  }, [])

  // Get combined dietary restrictions for all members
  const householdDietaryRestrictions = useMemo(() => {
    if (!members || members.length === 0) return {}

    // If ANY member has a restriction, the household has it
    return {
      dairy_free: members.some(m => m.dietary_restrictions?.dairy_free),
      gluten_free: members.some(m => m.dietary_restrictions?.gluten_free),
      nut_free: members.some(m => m.dietary_restrictions?.nut_free),
      vegetarian: members.some(m => m.dietary_restrictions?.vegetarian),
      vegan: members.some(m => m.dietary_restrictions?.vegan),
    }
  }, [members])

  // Get most restrictive phase (lowest phase number)
  const householdPhase = useMemo(() => {
    if (!members || members.length === 0) return 1
    return Math.min(...members.map(m => m.current_phase || 1))
  }, [members])

  // Calculate portion for active member
  const getActiveMemberPortion = useCallback((recipe, mealType) => {
    if (!activeMember) return 1
    return calculatePortionMultiplier(activeMember, recipe, mealType)
  }, [activeMember])

  // Calculate shopping multiplier for whole household
  const getShoppingMultiplier = useCallback((recipe, mealType) => {
    return calculateHouseholdMultiplier(members, recipe, mealType)
  }, [members])

  // Get member by ID
  const getMember = useCallback((memberId) => {
    return members.find(m => m.id === memberId) || null
  }, [members])

  // Update member profile
  const updateMember = useCallback(async (memberId, updates) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)

      if (error) throw error

      // Update local state
      setMembers(prev => prev.map(m => {
        if (m.id === memberId) {
          const updated = { ...m, ...updates }
          return {
            ...updated,
            targets: calculateMemberTargets(updated),
          }
        }
        return m
      }))

      // Update active member if it was updated
      if (activeMember?.id === memberId) {
        setActiveMember(prev => {
          const updated = { ...prev, ...updates }
          return {
            ...updated,
            targets: calculateMemberTargets(updated),
          }
        })
      }

      return { success: true }
    } catch (err) {
      console.error('Error updating member:', err)
      return { success: false, error: err.message }
    }
  }, [activeMember])

  // Add new member to household
  const addMember = useCallback(async (memberData) => {
    if (!household) return { success: false, error: 'No household' }

    try {
      const { data, error } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          ...memberData,
          is_primary: false,
        })
        .select()
        .single()

      if (error) throw error

      const newMember = {
        ...data,
        targets: calculateMemberTargets(data),
      }

      setMembers(prev => [...prev, newMember])

      return { success: true, member: newMember }
    } catch (err) {
      console.error('Error adding member:', err)
      return { success: false, error: err.message }
    }
  }, [household])

  // Remove member from household
  const removeMember = useCallback(async (memberId) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setMembers(prev => prev.filter(m => m.id !== memberId))

      // If removed member was active, switch to another
      if (activeMember?.id === memberId) {
        const remaining = members.filter(m => m.id !== memberId)
        setActiveMember(remaining[0] || null)
      }

      return { success: true }
    } catch (err) {
      console.error('Error removing member:', err)
      return { success: false, error: err.message }
    }
  }, [activeMember, members])

  const value = {
    // State
    household,
    members,
    activeMember,
    loading,
    error,

    // Setters
    setActiveMember,

    // Computed
    householdDietaryRestrictions,
    householdPhase,

    // Calculations
    getActiveMemberPortion,
    getShoppingMultiplier,
    getMember,
    calculateMemberTargets,

    // Actions
    updateMember,
    addMember,
    removeMember,

    // Constants
    MEAL_DISTRIBUTION,
    PHASE_RATIOS,
  }

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}

// Export utility functions for use elsewhere
export {
  calculateMemberTargets,
  calculatePortionMultiplier,
  calculateHouseholdMultiplier,
  PHASE_RATIOS,
  ACTIVITY_MULTIPLIERS,
  MEAL_DISTRIBUTION,
}
