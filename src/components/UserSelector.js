'use client'

import { useUser } from '@/context/UserContext'
import { calculateNutritionTargets } from '@/lib/nutrition'

export default function UserSelector() {
  const { users, currentUser, setCurrentUser, loading } = useUser()

  if (loading) {
    return <div>Loading...</div>
  }

  const targets = currentUser ? calculateNutritionTargets(currentUser) : null

  return (
    <div className="p-4 bg-slate-100 rounded-lg">
      <label className="block text-sm font-medium mb-2">
        Who's eating?
      </label>
      <select
        value={currentUser?.id || ''}
        onChange={(e) => {
          const selected = users.find(u => u.id === e.target.value)
          setCurrentUser(selected)
        }}
        className="w-full p-2 border rounded mb-4"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>

      {targets && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white p-2 rounded">
            <div className="text-lg font-bold">{targets.calories}</div>
            <div className="text-xs text-gray-500">calories</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-lg font-bold">{targets.protein}g</div>
            <div className="text-xs text-gray-500">protein</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-lg font-bold">{targets.fat}g</div>
            <div className="text-xs text-gray-500">fat</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="text-lg font-bold">{targets.carbs}g</div>
            <div className="text-xs text-gray-500">carbs</div>
          </div>
        </div>
      )}
    </div>
  )
}