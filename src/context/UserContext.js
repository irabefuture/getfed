'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateNutritionTargets } from '@/lib/nutrition'

// 1. Create the Context
const UserContext = createContext()

// 2. Create the Provider component
export function UserProvider({ children }) {
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch users from Supabase when component mounts
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      
      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data)
        // Auto-select first user if none selected
        if (data.length > 0) {
          setUser(data[0])
        }
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  // Calculate nutrition targets for current user
  const targets = user ? calculateNutritionTargets(user) : null

  // What we're making available to other components
  const value = {
    users,
    user,
    setUser,
    targets,
    loading
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
