'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { calculateNutritionTargets } from '@/lib/nutrition'

export default function MealGeneratorTest() {
  const { currentUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const testGeneration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Calculate targets for current user
      const targets = currentUser ? calculateNutritionTargets(currentUser) : null

      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealCount: 2,  // Just 2 meals for testing
          mealType: 'dinner',
          servings: 2,
          constraints: 'Quick meals under 30 minutes total',
          userTargets: targets
        })
      })

      const data = await response.json()
      
      if (data.error) {
        setError(data.error + (data.details ? `: ${data.details}` : ''))
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">🧪 AI Meal Generation Test</h2>
      
      <button
        onClick={testGeneration}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? 'Generating...' : 'Generate 2 Test Meals'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">
            Tokens used: {result.usage?.input_tokens} in / {result.usage?.output_tokens} out
          </p>
          
          <div className="space-y-4">
            {result.meals?.map((meal, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg">{meal.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{meal.description}</p>
                
                <div className="flex gap-4 text-sm text-gray-500 mb-2">
                  <span>⏱️ Prep: {meal.prep_time_mins}min</span>
                  <span>🍳 Cook: {meal.cook_time_mins}min</span>
                  <span>🍽️ Serves: {meal.serves}</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 bg-gray-50 p-2 rounded text-center text-sm mb-3">
                  <div><strong>{meal.per_serve?.calories}</strong><br/>cal</div>
                  <div><strong>{meal.per_serve?.protein_g}g</strong><br/>protein</div>
                  <div><strong>{meal.per_serve?.fat_g}g</strong><br/>fat</div>
                  <div><strong>{meal.per_serve?.carbs_g}g</strong><br/>carbs</div>
                </div>
                
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600">View ingredients & instructions</summary>
                  <div className="mt-2 pl-4">
                    <p className="font-medium">Ingredients:</p>
                    <ul className="list-disc pl-4">
                      {meal.ingredients?.map((ing, i) => (
                        <li key={i}>{ing.name}: {ing.grams}g</li>
                      ))}
                    </ul>
                    <p className="font-medium mt-2">Instructions:</p>
                    <p className="whitespace-pre-line text-gray-600">{meal.instructions}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
