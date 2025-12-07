/**
 * API Route: /api/generate-smart-meals
 *
 * AI-powered meal selection from the recipe library.
 * Uses Claude to intelligently select recipes based on:
 * - User's phase and macro targets
 * - Dietary restrictions
 * - Variety (protein rotation, no consecutive repeats)
 * - Preference for batch-friendly, lunchbox-friendly, etc.
 *
 * Cost-optimised: sends minimal recipe data (~IDs, names, macros, key flags)
 * Target: <$0.05 per week generation
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Phase macro ratios from Galveston Diet
const PHASE_TARGETS = {
  phase1: { fat: 0.70, protein: 0.20, carbs: 0.10, description: 'strictest, 70% fat' },
  phase2: { fat: 0.55, protein: 0.20, carbs: 0.25, description: 'transition, 50-60% fat' },
  phase3: { fat: 0.40, protein: 0.20, carbs: 0.40, description: 'maintenance, 40% fat' },
}

/**
 * Build minimal recipe context for Claude
 * Only send what's needed for selection, not full recipes
 */
function buildRecipeContext(recipes, phase) {
  // Filter recipes compatible with user's phase
  const phaseNum = parseInt(phase.replace('phase', ''))
  const compatibleRecipes = recipes.filter(r => r.phase?.includes(phaseNum))

  // Group by meal type for easier Claude processing
  const byMealType = {
    lunch: [],
    dinner: [],
    snack_afternoon: [],
    snack_evening: [],
    breakfast: [],
  }

  compatibleRecipes.forEach(r => {
    const type = r.meal_type
    if (byMealType[type]) {
      byMealType[type].push({
        id: r.id,
        name: r.name,
        category: r.category,
        cal: r.per_serve?.calories || 0,
        p: r.per_serve?.protein_g || 0,
        f: r.per_serve?.fat_g || 0,
        c: r.per_serve?.carbs_g || 0,
        time: r.total_time_mins || 30,
        batch: r.batch_friendly ? 1 : 0,
        lunchbox: r.good_for_lunchbox ? 1 : 0,
        dairy_free: r.dietary?.dairy_free ? 1 : 0,
        gluten_free: r.dietary?.gluten_free ? 1 : 0,
        nut_free: r.dietary?.nut_free ? 1 : 0,
        vegetarian: r.dietary?.vegetarian ? 1 : 0,
        vegan: r.dietary?.vegan ? 1 : 0,
      })
    }
  })

  return byMealType
}

/**
 * Format recipes for prompt (compact format)
 */
function formatRecipesForPrompt(recipesByType) {
  let output = ''

  for (const [mealType, recipes] of Object.entries(recipesByType)) {
    if (recipes.length === 0) continue

    const typeLabel = mealType.replace('_', ' ').toUpperCase()
    output += `\n${typeLabel} OPTIONS:\n`

    recipes.forEach(r => {
      const flags = []
      if (r.batch) flags.push('B')      // Batch friendly
      if (r.lunchbox) flags.push('L')   // Lunchbox
      if (r.dairy_free) flags.push('DF')
      if (r.gluten_free) flags.push('GF')
      if (r.nut_free) flags.push('NF')
      if (r.vegetarian) flags.push('V')
      if (r.vegan) flags.push('VG')

      const flagStr = flags.length > 0 ? ` [${flags.join(',')}]` : ''
      output += `- ${r.id} | ${r.name} | ${r.category} | ${r.cal}cal ${r.p}p ${r.f}f ${r.c}c | ${r.time}min${flagStr}\n`
    })
  }

  return output
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      recipes,              // Full recipe array from client
      phase = 'phase1',     // User's current phase
      dailyCalories = 2000, // User's daily calorie target
      dailyProtein = 100,   // Daily protein target (g)
      dailyFat = 150,       // Daily fat target (g)
      dailyCarbs = 50,      // Daily carbs target (g)
      daysToGenerate = 7,   // Number of days to plan
      dietary = {},         // { dairyFree, glutenFree, nutFree, vegetarian }
      preferences = {},     // { batchFriendly, lunchboxFriendly }
      excludeIds = [],      // Recipe IDs to avoid (recently used)
      recentProteins = [],  // Protein categories used recently (for variety)
    } = body

    if (!recipes || recipes.length === 0) {
      return Response.json({ error: 'No recipes provided' }, { status: 400 })
    }

    // Build compact recipe context
    const recipesByType = buildRecipeContext(recipes, phase)
    const recipeContext = formatRecipesForPrompt(recipesByType)

    // Build dietary filter string
    const dietaryFilters = []
    if (dietary.dairyFree) dietaryFilters.push('MUST be dairy-free (DF flag)')
    if (dietary.glutenFree) dietaryFilters.push('MUST be gluten-free (GF flag)')
    if (dietary.nutFree) dietaryFilters.push('MUST be nut-free (NF flag)')
    if (dietary.vegetarian) dietaryFilters.push('MUST be vegetarian (V flag)')

    const prefFilters = []
    if (preferences.batchFriendly) prefFilters.push('PREFER batch-friendly (B flag) for batch cooking days')
    if (preferences.lunchboxFriendly) prefFilters.push('PREFER lunchbox-friendly (L flag) for work lunches')

    // Phase info
    const phaseInfo = PHASE_TARGETS[phase] || PHASE_TARGETS.phase1

    // Calculate explicit calorie targets per meal slot
    const mealTargets = {
      lunch: Math.round(dailyCalories * 0.35),
      snack_afternoon: Math.round(dailyCalories * 0.10),
      dinner: Math.round(dailyCalories * 0.45),
      snack_evening: Math.round(dailyCalories * 0.10),
    }

    const systemPrompt = `You are a meal planning AI for the Galveston Diet. Select recipes from the provided library to create balanced meal plans.

PHASE: ${phase} (${phaseInfo.description})
Target macro ratios: ${Math.round(phaseInfo.fat * 100)}% fat, ${Math.round(phaseInfo.protein * 100)}% protein, ${Math.round(phaseInfo.carbs * 100)}% carbs

DAILY TARGETS (MUST hit within 10%):
- Total Calories: ${dailyCalories} cal/day
- Protein: ${dailyProtein}g
- Fat: ${dailyFat}g
- Carbs: ${dailyCarbs}g

MEAL CALORIE TARGETS (select recipes that add up to these):
- Lunch: ${mealTargets.lunch} cal (main meal - select higher calorie options)
- Afternoon Snack: ${mealTargets.snack_afternoon} cal
- Dinner: ${mealTargets.dinner} cal (largest meal - select highest calorie dinner options)
- Evening Snack: ${mealTargets.snack_evening} cal
- TOTAL: ${dailyCalories} cal

CRITICAL: The sum of selected meals MUST be between ${Math.round(dailyCalories * 0.9)} and ${Math.round(dailyCalories * 1.1)} calories. If a single recipe doesn't hit the target for a slot, that's OK - but the DAILY TOTAL must be close to ${dailyCalories} cal. Select larger/higher-calorie recipes for main meals.

CRITICAL RULES:
1. ONLY select recipe IDs from the provided list
2. Balance macros across the day to hit targets (within 10%)
3. Rotate protein categories - don't repeat same protein type (e.g., poultry) on consecutive days
4. Avoid repeating the same recipe within 7 days
5. Consider prep time - suggest simpler meals for weekdays
${dietaryFilters.length > 0 ? '\nDIETARY REQUIREMENTS:\n- ' + dietaryFilters.join('\n- ') : ''}
${prefFilters.length > 0 ? '\nPREFERENCES:\n- ' + prefFilters.join('\n- ') : ''}
${excludeIds.length > 0 ? `\nEXCLUDE these recently used recipes: ${excludeIds.join(', ')}` : ''}
${recentProteins.length > 0 ? `\nVARY from recent proteins: ${recentProteins.join(', ')} - pick different categories` : ''}

OUTPUT FORMAT (JSON only, no other text):
{
  "plan": [
    {
      "day": 1,
      "meals": {
        "lunch": "recipe-id-here",
        "snack_afternoon": "recipe-id-here",
        "dinner": "recipe-id-here",
        "snack_evening": "recipe-id-here"
      },
      "daily_totals": { "cal": 2100, "p": 105, "f": 160, "c": 55 },
      "notes": "Optional brief note about the day's balance"
    }
  ],
  "variety_notes": "Brief note on protein rotation and variety achieved"
}`

    const userPrompt = `Generate a ${daysToGenerate}-day meal plan selecting from these recipes:
${recipeContext}

Select recipes that balance macros across each day and provide variety across the week. Return ONLY valid JSON.`

    // Call Claude (using Sonnet for cost efficiency)
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    })

    // Parse response
    const responseText = message.content[0].text
    let plan

    try {
      plan = JSON.parse(responseText)
    } catch (parseError) {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0])
      } else {
        return Response.json({
          error: 'Failed to parse AI response',
          raw: responseText
        }, { status: 500 })
      }
    }

    // Validate that all recipe IDs exist
    const allRecipeIds = new Set(recipes.map(r => r.id))
    const invalidIds = []

    if (plan.plan) {
      plan.plan.forEach(day => {
        if (day.meals) {
          Object.values(day.meals).forEach(id => {
            if (id && !allRecipeIds.has(id)) {
              invalidIds.push(id)
            }
          })
        }
      })
    }

    return Response.json({
      success: true,
      plan: plan.plan || [],
      variety_notes: plan.variety_notes || '',
      invalid_ids: invalidIds,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        estimated_cost: (message.usage.input_tokens * 0.003 + message.usage.output_tokens * 0.015) / 1000
      }
    })

  } catch (error) {
    console.error('Smart meal generation error:', error)
    return Response.json({
      error: 'Failed to generate meal plan',
      details: error.message
    }, { status: 500 })
  }
}
