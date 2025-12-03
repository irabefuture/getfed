'use client'

import { useState } from 'react'

export default function IngredientList({ ingredients }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [meal, setMeal] = useState([])
  const addToMeal = (ingredient) => {
  setMeal([...meal, { ingredient, quantity: 100 }])
}


  // Get unique categories from the data
  const categories = ['all', ...new Set(ingredients.map(i => i.category))].sort()

  // Filter by both search and category
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || ingredient.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      {/* Meal Panel */}
      {meal.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold mb-3">Your Meal</h2>
          
          {meal.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-blue-100">
              <span>{item.ingredient.name}</span>
              <span className="text-gray-600">{item.quantity}g</span>
            </div>
          ))}
          
          <div className="mt-4 pt-3 border-t border-blue-300 font-semibold">
            Totals: P: 0g | F: 0g | C: 0g | 0 cal
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search ingredients..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 mb-4"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${selectedCategory === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      <p className="text-gray-600 mb-4">
        Showing {filteredIngredients.length} of {ingredients.length} ingredients
      </p>

      <div className="grid gap-4">
        {filteredIngredients.map(ingredient => (
        <div key={ingredient.id} className="bg-white rounded-lg p-4 shadow flex justify-between items-center">
  <div>
    <h2 className="text-xl font-semibold">{ingredient.name}</h2>
    <p className="text-gray-600">
      {ingredient.category} · per 100{['oils', 'beverages', 'vinegars', 'condiments'].includes(ingredient.category) ? 'ml' : 'g'}
    </p>
    <p className="text-sm text-gray-500">
      P: {ingredient.protein_g}g | F: {ingredient.fat_g}g | C: {ingredient.carbs_g}g | {ingredient.calories} cal
    </p>
  </div>
  <button
    onClick={() => addToMeal(ingredient)}
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
  >
    + Add
  </button>
</div>
        ))}
      </div>
    </div>
  )
}