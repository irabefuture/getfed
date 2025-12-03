import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read from .env.local automatically
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Read the JSON file
const data = JSON.parse(readFileSync('./data/ingredients.json', 'utf-8'))

// Transform ingredients for database
const rows = data.ingredients.map(ingredient => ({
  id: ingredient.id,
  name: ingredient.name,
  category: ingredient.category,
  protein_g: ingredient.protein_g,
  fat_g: ingredient.fat_g,
  carbs_g: ingredient.carbs_g,
  calories: ingredient.calories,
  anti_inflammatory_compounds: ingredient.anti_inflammatory_compounds.join(', ')
}))

console.log(`Loading ${rows.length} ingredients...`)

// Insert into Supabase
const { data: result, error } = await supabase
  .from('ingredients')
  .insert(rows)

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Success! Loaded all ingredients.')
}