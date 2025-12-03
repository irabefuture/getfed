// API Route: /api/generate-meals
// This runs on the SERVER, not in the browser
// That's why we can safely use the Anthropic API key here

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Create Anthropic client (Claude)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// POST handler - receives meal generation request
export async function POST(request) {
  try {
    // Create Supabase client INSIDE the function
    // (ensures environment variables are available)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 1. Parse the incoming request
    const body = await request.json()
    const { 
      mealCount = 4,           // How many meals to generate
      mealType = 'dinner',     // breakfast, lunch, dinner, snack
      servings = 2,            // Portions per meal
      constraints = '',        // User guidance like "use the lamb"
      userTargets = null       // User's calorie/macro targets
    } = body

    // 2. Fetch all ingredients from database
    // Column names: protein_g, fat_g, carbs_g, calories (per 100g)
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('id, name, category, protein_g, fat_g, carbs_g, calories')
    
    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ 
        error: 'Failed to fetch ingredients', 
        details: error.message 
      }, { status: 500 })
    }

    if (!ingredients || ingredients.length === 0) {
      return Response.json({ 
        error: 'No ingredients found in database' 
      }, { status: 500 })
    }

    // 3. Format ingredients for the prompt
    // Group by category for easier reading
    const ingredientsByCategory = ingredients.reduce((acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = []
      acc[ing.category].push(ing)
      return acc
    }, {})

    const ingredientList = Object.entries(ingredientsByCategory)
      .map(([category, items]) => {
        const itemList = items.map(i => 
          `  - ${i.name} (${i.id}): ${i.protein_g}g P, ${i.fat_g}g F, ${i.carbs_g}g C per 100g`
        ).join('\n')
        return `${category}:\n${itemList}`
      })
      .join('\n\n')

    // 4. Build the prompt for Claude
    const systemPrompt = `You are a meal planning assistant for the Galveston Diet. You create anti-inflammatory meals using ONLY ingredients from the approved list provided.

CRITICAL RULES:
1. ONLY use ingredients from the provided list - no exceptions
2. Use the exact ingredient ID when specifying ingredients
3. All quantities in grams
4. Macros must be calculated accurately based on the per-100g values provided
5. Meals should be practical and delicious, not just technically compliant
6. Australian cooking style and measurements (metric)

OUTPUT FORMAT:
Return ONLY valid JSON, no other text. Use this exact structure:
{
  "meals": [
    {
      "name": "Meal Name",
      "description": "Brief appetising description",
      "meal_type": "${mealType}",
      "serves": ${servings},
      "prep_time_mins": 15,
      "cook_time_mins": 25,
      "ingredients": [
        {"id": "ingredient_id", "name": "Ingredient Name", "grams": 150}
      ],
      "instructions": "1. First step...\\n2. Second step...",
      "per_serve": {
        "protein_g": 42,
        "fat_g": 28,
        "carbs_g": 12,
        "calories": 468
      }
    }
  ]
}`

    const userPrompt = `Generate ${mealCount} ${mealType} meals, each serving ${servings} people.

${constraints ? `USER CONSTRAINTS: ${constraints}\n` : ''}
${userTargets ? `TARGET PER MEAL: Aim for roughly ${Math.round(userTargets.calories / 2)} calories, ${Math.round(userTargets.protein / 2)}g protein per serve (this is approximately half daily intake for a main meal)\n` : ''}

APPROVED INGREDIENTS (use ONLY these, with exact IDs):

${ingredientList}

Generate ${mealCount} varied, delicious ${mealType} meals. Each should be different - vary the proteins, vegetables, and cooking methods.`

    // 5. Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    })

    // 6. Parse Claude's response
    const responseText = message.content[0].text
    
    // Try to parse as JSON
    let meals
    try {
      meals = JSON.parse(responseText)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        meals = JSON.parse(jsonMatch[0])
      } else {
        return Response.json({ 
          error: 'Failed to parse AI response',
          raw: responseText 
        }, { status: 500 })
      }
    }

    // 7. Return the generated meals
    return Response.json({
      success: true,
      meals: meals.meals,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    })

  } catch (error) {
    console.error('Meal generation error:', error)
    return Response.json({ 
      error: 'Failed to generate meals',
      details: error.message 
    }, { status: 500 })
  }
}
