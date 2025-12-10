'use client'

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateNutritionTargets } from '@/lib/nutrition'
import { calculateMemberTargets } from './HouseholdContext'
import { logSupabase, logDebug, logError } from '@/lib/errorLogger'

// 1. Create the Context
const UserContext = createContext()

// 2. Create the Provider component
export function UserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Household state
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [activeMember, setActiveMember] = useState(null)

  // Fetch users from Supabase when component mounts
  useEffect(() => {
    async function fetchUsers() {
      logDebug('UserContext:fetchUsers', { action: 'start' })

      const result = await supabase
        .from('users')
        .select('*')

      // Log the Supabase response
      logSupabase('fetchUsers', result)

      const { data, error } = result

      if (error) {
        logError('supabase', `fetchUsers failed: ${error.message}`, {
          context: { code: error.code, details: error.details }
        })
      } else {
        logDebug('UserContext:fetchUsers', {
          action: 'success',
          userCount: data?.length || 0,
          firstUserId: data?.[0]?.id
        })
        setUsers(data)
        // Auto-select first user if none selected
        if (data.length > 0) {
          const selectedUser = data[0]
          setUser(selectedUser)

          // If user has household, fetch it
          if (selectedUser.household_id) {
            fetchHousehold(selectedUser.household_id)
          }
        }
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  // Fetch household and members
  async function fetchHousehold(householdId) {
    logDebug('UserContext:fetchHousehold', { householdId, action: 'start' })

    try {
      // Fetch household
      const householdResult = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single()

      logSupabase('fetchHousehold', householdResult, { householdId })

      const { data: householdData, error: householdError } = householdResult
      if (householdError) throw householdError

      setHousehold(householdData)

      // Fetch members
      const membersResult = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId)
        .order('is_primary', { ascending: false })

      logSupabase('fetchHouseholdMembers', membersResult, { householdId })

      const { data: memberData, error: membersError } = membersResult
      if (membersError) throw membersError

      // Add calculated targets to each member
      const membersWithTargets = (memberData || []).map(m => ({
        ...m,
        targets: calculateMemberTargets(m),
      }))

      logDebug('UserContext:fetchHousehold', {
        action: 'success',
        householdName: householdData?.name,
        memberCount: membersWithTargets.length,
        members: membersWithTargets.map(m => ({ name: m.name, phase: m.current_phase }))
      })

      setMembers(membersWithTargets)

      // Set primary member as active
      const primary = membersWithTargets.find(m => m.is_primary)
      setActiveMember(primary || membersWithTargets[0] || null)

    } catch (err) {
      logError('supabase', `fetchHousehold failed: ${err.message}`, {
        stack: err.stack,
        context: { householdId }
      })
    }
  }

  // Calculate nutrition targets for current user (legacy)
  // Now also considers active member if in household mode
  const targets = useMemo(() => {
    if (activeMember?.targets) {
      return activeMember.targets
    }
    if (user) {
      return calculateNutritionTargets(user)
    }
    return null
  }, [user, activeMember])

  // Check if we're in household mode
  const isHouseholdMode = household !== null && members.length > 0

  // Get combined dietary restrictions from all members
  const householdDietaryRestrictions = useMemo(() => {
    if (!members || members.length === 0) return {}
    return {
      dairyFree: members.some(m => m.dietary_restrictions?.dairy_free),
      glutenFree: members.some(m => m.dietary_restrictions?.gluten_free),
      nutFree: members.some(m => m.dietary_restrictions?.nut_free),
      vegetarian: members.some(m => m.dietary_restrictions?.vegetarian),
      vegan: members.some(m => m.dietary_restrictions?.vegan),
    }
  }, [members])

  // Get most restrictive phase
  const householdPhase = useMemo(() => {
    if (!members || members.length === 0) return 1
    return Math.min(...members.map(m => m.current_phase || 1))
  }, [members])

  // What we're making available to other components
  const value = {
    // Legacy user support
    users,
    user,
    setUser,
    targets,
    loading,

    // Household support
    household,
    members,
    activeMember,
    setActiveMember,
    isHouseholdMode,
    householdDietaryRestrictions,
    householdPhase,

    // Refresh function
    refreshHousehold: () => user?.household_id && fetchHousehold(user.household_id),
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// 3. Create the hook for easy access
export function useUser() {
  return useContext(UserContext)
}
