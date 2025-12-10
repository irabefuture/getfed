/**
 * Shopping List utilities
 *
 * Supports household mode where:
 * - Each member has individual portion multipliers
 * - Shopping quantities aggregate all members' needs
 * - Example: Chicken 200g base × 2.31 household multiplier = 462g to buy
 */

import { calculateHouseholdServings } from './smartPlanner'
import { logDebug, logError } from './errorLogger'

// Category mappings - ORDER MATTERS for multi-word matches
// More specific terms (e.g., "garlic powder") must come before generic ones ("garlic")
const CATEGORY_MAP = {
  // Pantry - powders (must match BEFORE fresh produce versions)
  'garlic powder': 'pantry', 'onion powder': 'pantry',
  // Produce - vegetables
  'capsicum': 'produce', 'tomato': 'produce', 'cucumber': 'produce',
  'spinach': 'produce', 'kale': 'produce', 'lettuce': 'produce',
  'rocket': 'produce', 'avocado': 'produce', 'onion': 'produce',
  'garlic': 'produce', 'ginger': 'produce', 'carrot': 'produce',
  'celery': 'produce', 'broccoli': 'produce', 'cauliflower': 'produce',
  'zucchini': 'produce', 'eggplant': 'produce', 'mushroom': 'produce',
  'asparagus': 'produce', 'beans': 'produce', 'peas': 'produce',
  'cabbage': 'produce', 'squash': 'produce', 'pumpkin': 'produce',
  'sweet potato': 'produce', 'greens': 'produce', 'coleslaw': 'produce',
  'edamame': 'produce',
  // Produce - fruit
  'lemon': 'produce', 'lime': 'produce',
  'blueberries': 'produce', 'strawberries': 'produce', 'raspberries': 'produce',
  'apple': 'produce', 'banana': 'produce', 'orange': 'produce',
  // Produce - fresh herbs
  'basil': 'produce', 'parsley': 'produce', 'thyme': 'produce',
  'chives': 'produce', 'coriander': 'produce', 'dill': 'produce',
  'mint': 'produce', 'rosemary': 'produce', 'oregano': 'produce',
  // Meat
  'chicken': 'meat', 'beef': 'meat', 'lamb': 'meat', 'pork': 'meat',
  'turkey': 'meat', 'bacon': 'meat', 'mince': 'meat',
  'sirloin': 'meat', 'steak': 'meat',
  // Seafood
  'salmon': 'seafood', 'tuna': 'seafood', 'prawns': 'seafood',
  'fish': 'seafood', 'cod': 'seafood', 'barramundi': 'seafood',
  // Dairy
  'eggs': 'dairy', 'egg': 'dairy', 'milk': 'dairy', 'cream': 'dairy',
  'cheese': 'dairy', 'feta': 'dairy', 'parmesan': 'dairy', 'cheddar': 'dairy',
  'mozzarella': 'dairy', 'yoghurt': 'dairy', 'yogurt': 'dairy',
  'butter': 'dairy', 'cottage': 'dairy', 'ricotta': 'dairy',
  // Pantry - nuts & seeds
  'almond': 'pantry', 'walnut': 'pantry', 'pecan': 'pantry',
  'macadamia': 'pantry', 'cashew': 'pantry', 'coconut': 'pantry',
  'chia': 'pantry', 'flax': 'pantry', 'hemp': 'pantry',
  'sesame': 'pantry', 'sunflower': 'pantry',
  // Pantry - condiments & sauces
  'vinegar': 'pantry', 'mustard': 'pantry', 'mayonnaise': 'pantry',
  'stock': 'pantry', 'broth': 'pantry', 'sauce': 'pantry',
  'tahini': 'pantry', 'tamari': 'pantry', 'pickle': 'pantry',
  // Pantry - spices
  'cinnamon': 'pantry', 'cumin': 'pantry', 'paprika': 'pantry',
  'nutmeg': 'pantry', 'seasoning': 'pantry', 'chilli': 'pantry',
  'turmeric': 'pantry',
  // Pantry - baking
  'baking powder': 'pantry', 'baking soda': 'pantry',
  'cacao': 'pantry', 'cocoa': 'pantry', 'vanilla': 'pantry',
  'xanthan': 'pantry', 'flour': 'pantry',
  // Pantry - sweeteners
  'honey': 'pantry', 'maple': 'pantry', 'monk fruit': 'pantry',
  'stevia': 'pantry', 'swerve': 'pantry', 'erythritol': 'pantry',
  // Pantry - protein & other
  'collagen': 'pantry', 'protein powder': 'pantry',
  'tofu': 'pantry', 'tempeh': 'pantry', 'chocolate': 'pantry',
  'coffee': 'pantry', 'wine': 'pantry',
}

const PANTRY_STAPLES = ['salt', 'pepper', 'black pepper', 'olive oil', 'water', 'ice']

// AU-friendly unit conversions
const UNIT_HINTS = {
  'egg': (g) => `~${Math.ceil(g / 50)} eggs`,
  'avocado': (g) => `~${Math.ceil(g / 170)}`,                 // AU avocados ~170g
  'capsicum': (g) => `~${Math.ceil(g / 180)} medium`,         // AU capsicums ~180g
  'tomato': (g) => `~${Math.ceil(g / 150)} medium`,
  'cherry tomato': (g) => `~${Math.ceil(g / 250)} punnets`,   // 250g punnet standard
  'grape tomato': (g) => `~${Math.ceil(g / 250)} punnets`,    // 250g punnet standard
  'onion': (g) => `~${Math.ceil(g / 150)} medium`,
  'cucumber': (g) => `~${Math.ceil(g / 300)}`,                // Lebanese ~150g, telegraph ~300g
  'lemon': (g) => `~${Math.ceil(g / 80)}`,                    // AU lemons ~80g
  'lime': (g) => `~${Math.ceil(g / 50)}`,                     // AU limes ~50g
  'garlic': (g) => `~${Math.ceil(g / 5)} cloves`,
  'chicken breast': (g) => `~${Math.ceil(g / 180)} breasts`,  // AU chicken breast ~180g
  'salmon': (g) => `~${Math.ceil(g / 180)} fillets`,
  'banana': (g) => `~${Math.ceil(g / 120)}`,
  'broccoli': (g) => `~${Math.ceil(g / 400)} heads`,          // Medium broccoli head ~400g
  'cauliflower': (g) => `~${Math.ceil(g / 600)} heads`,       // Medium cauliflower ~600g
  'zucchini': (g) => `~${Math.ceil(g / 200)} medium`,
  'carrot': (g) => `~${Math.ceil(g / 80)} medium`,
  'celery': (g) => `~${Math.ceil(g / 40)} stalks`,
  'mushroom': (g) => `~${Math.ceil(g / 250)} punnets`,        // 250g punnet standard
  'asparagus': (g) => `~${Math.ceil(g / 180)} bunches`,       // Standard bunch ~180g
  'kale': (g) => `~${Math.ceil(g / 200)} bunches`,
  'spinach': (g) => `~${Math.ceil(g / 120)} bags`,            // 120g bag standard
  'rocket': (g) => `~${Math.ceil(g / 120)} bags`,             // 120g bag standard
  'cos lettuce': (g) => `~${Math.ceil(g / 350)} heads`,
  'butter lettuce': (g) => `~${Math.ceil(g / 200)} heads`,
}

// Ingredients that should NOT get unit hints even if they contain hint keywords
// e.g., "whole egg mayonnaise" contains "egg" but shouldn't show "~2 eggs"
// e.g., "no-sugar tomato sauce" contains "tomato" but shouldn't show "~3 medium"
const HINT_EXCLUSIONS = ['mayonnaise', 'mayo', 'aioli', 'oil', 'powder', 'extract', 'juice', 'zest', 'sauce']

function normalizeIngredientName(name) {
  let n = name.toLowerCase().trim().replace(/\s*\(.*\)\s*/g, '').replace(/,.*$/, '').trim()
  n = n.replace(/ies$/, 'y').replace(/ves$/, 'f').replace(/oes$/, 'o').replace(/es$/, '').replace(/s$/, '')

  const variations = {
    'hard boiled egg': 'egg', 'hard-boiled egg': 'egg', 'boiled egg': 'egg', 'poached egg': 'egg',
    'baby spinach': 'spinach', 'fresh spinach': 'spinach',
    'red capsicum': 'capsicum red', 'green capsicum': 'capsicum green',
    'salmon fillet': 'salmon', 'greek yoghurt': 'greek yoghurt', 'greek yogurt': 'greek yoghurt',
    'feta cheese': 'feta', 'lemon juice': 'lemon', 'lime juice': 'lime',
  }
  return variations[n] || n
}

function getCategory(name) {
  const n = name.toLowerCase()
  // Sort by key length (longest first) so "garlic powder" matches before "garlic"
  const sortedEntries = Object.entries(CATEGORY_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [k, v] of sortedEntries) {
    if (n.includes(k)) return v
  }
  return 'other'
}

function isStaple(name) {
  const n = name.toLowerCase()
  return PANTRY_STAPLES.some(s => n.includes(s))
}

function getHint(name, grams) {
  const n = name.toLowerCase()

  // Skip hints for compound/processed ingredients
  if (HINT_EXCLUSIONS.some(excl => n.includes(excl))) {
    return null
  }

  // For very small amounts (spices), show friendly units
  if (grams <= 5) {
    return '~1 tsp'
  }
  if (grams <= 10) {
    return '~2 tsp'
  }

  // Check longer/more specific matches first
  const sortedHints = Object.entries(UNIT_HINTS).sort((a, b) => b[0].length - a[0].length)
  for (const [k, fn] of sortedHints) {
    if (n.includes(k)) return fn(grams)
  }
  return null
}

/**
 * Generate shopping list from meal plan with detailed breakdown
 * @param {Object} meals - Meals keyed by date, then by meal type
 * @param {Array} dateKeys - Array of date keys to include
 * @param {number|Array} servingsOrMembers - Either a simple multiplier OR array of household members
 * @param {boolean} includeBreakdown - If true, include sources breakdown for each ingredient
 * @returns {Object} Grouped shopping list by category (with optional breakdown)
 */
export function generateShoppingList(meals, dateKeys, servingsOrMembers = 1, includeBreakdown = false) {
  const map = {}
  const debugLog = []

  // Determine if we're in household mode (array of members) or simple mode (number)
  const isHouseholdMode = Array.isArray(servingsOrMembers)
  const members = isHouseholdMode ? servingsOrMembers : null
  const simpleMultiplier = isHouseholdMode ? 1 : servingsOrMembers

  // Debug log inputs
  logDebug('ShoppingList:generate', {
    dateCount: dateKeys.length,
    dateRange: dateKeys.length > 0 ? `${dateKeys[0]} to ${dateKeys[dateKeys.length - 1]}` : 'none',
    isHouseholdMode,
    memberCount: members?.length || 0,
    simpleMultiplier,
    mealCount: dateKeys.reduce((acc, dk) => acc + Object.keys(meals[dk] || {}).length, 0),
    includeBreakdown
  })

  dateKeys.forEach(dk => {
    const day = meals[dk] || {}

    Object.entries(day).forEach(([mealType, recipe]) => {
      if (!recipe?.ingredients) return

      // Calculate multiplier for this recipe
      let multiplier = simpleMultiplier
      if (isHouseholdMode && members.length > 0) {
        // Sum all members' portion needs for this recipe
        multiplier = calculateHouseholdServings(members, recipe, mealType)
      }

      const baseServings = recipe.base_servings || 1

      recipe.ingredients.forEach(ing => {
        if (isStaple(ing.name)) return
        const key = normalizeIngredientName(ing.name)
        // Divide by base_servings first (recipe amounts are for base_servings), then multiply by household needs
        const perServeGrams = (ing.grams || 0) / baseServings
        const scaledGrams = perServeGrams * multiplier

        // Debug log entry
        debugLog.push({
          ingredient: ing.name,
          key,
          date: dk,
          recipe: recipe.name,
          mealType,
          recipeGrams: ing.grams,
          baseServings,
          perServeGrams: Math.round(perServeGrams * 10) / 10,
          multiplier: Math.round(multiplier * 100) / 100,
          scaledGrams: Math.round(scaledGrams * 10) / 10
        })

        if (map[key]) {
          map[key].grams += scaledGrams
          if (!map[key].names.includes(ing.name)) {
            map[key].names.push(ing.name)
          }
          // Track sources for breakdown
          map[key].sources.push({
            date: dk,
            recipe: recipe.name,
            mealType,
            grams: Math.round(scaledGrams)
          })
        } else {
          map[key] = {
            names: [ing.name],
            grams: scaledGrams,
            category: getCategory(ing.name),
            sources: [{
              date: dk,
              recipe: recipe.name,
              mealType,
              grams: Math.round(scaledGrams)
            }]
          }
        }
      })
    })
  })

  // Log debug info to console and error logger
  if (debugLog.length > 0) {
    console.group('🛒 Shopping List Generation Debug')
    console.table(debugLog)
    console.groupEnd()

    // Also log summary to error logger for mobile debugging
    logDebug('ShoppingList:calculation', {
      ingredientCount: debugLog.length,
      uniqueIngredients: Object.keys(map).length,
      totalGrams: Math.round(Object.values(map).reduce((acc, v) => acc + v.grams, 0)),
      sampleCalculations: debugLog.slice(0, 5).map(d => ({
        ingredient: d.ingredient,
        recipe: d.recipe,
        scaled: `${d.perServeGrams}g × ${d.multiplier} = ${d.scaledGrams}g`
      }))
    })
  }

  const items = Object.entries(map).map(([k, v]) => {
    const item = {
      name: v.names.sort((a, b) => a.length - b.length)[0],
      grams: Math.round(v.grams),
      category: v.category,
      hint: getHint(k, v.grams)
    }
    if (includeBreakdown) {
      item.sources = v.sources
    }
    return item
  })

  const grouped = { produce: [], meat: [], seafood: [], dairy: [], pantry: [], other: [] }
  items.forEach(i => {
    const category = grouped[i.category] ? i.category : 'other'
    grouped[category].push(i)
  })

  // Sort each category alphabetically
  Object.keys(grouped).forEach(c => {
    grouped[c].sort((a, b) => a.name.localeCompare(b.name))
  })

  return grouped
}

/**
 * Generate shopping list with full breakdown of ingredient sources
 * @param {Object} meals - Meals keyed by date
 * @param {Array} dateKeys - Date keys to include
 * @param {number|Array} servingsOrMembers - Multiplier or household members
 * @returns {Object} Grouped shopping list with sources breakdown
 */
export function generateShoppingListWithBreakdown(meals, dateKeys, servingsOrMembers = 1) {
  return generateShoppingList(meals, dateKeys, servingsOrMembers, true)
}

/**
 * Generate shopping list for a household (convenience wrapper)
 * @param {Object} meals - Meals keyed by date
 * @param {Array} dateKeys - Date keys to include
 * @param {Array} members - Household members array
 * @returns {Object} Grouped shopping list
 */
export function generateHouseholdShoppingList(meals, dateKeys, members) {
  return generateShoppingList(meals, dateKeys, members)
}

export function generateMealPlanHash(meals, dateKeys, excludedMeals = []) {
  const ids = []
  dateKeys.forEach(dk => {
    const day = meals[dk] || {}
    Object.keys(day).sort().forEach(slot => { if (day[slot]?.id) ids.push(`${dk}:${slot}:${day[slot].id}`) })
  })
  // Include excluded meals in hash so exclusion changes trigger update
  const exclusionStr = excludedMeals.length > 0 ? `|excluded:${[...excludedMeals].sort().join(',')}` : ''
  return ids.sort().join('|') + exclusionStr
}

export const CATEGORY_LABELS = { produce: 'Fruit & Veg', meat: 'Meat', seafood: 'Seafood', dairy: 'Dairy & Eggs', pantry: 'Pantry', other: 'Other' }

export function saveShoppingList(userId, list, weekLabel, mealPlanHash) {
  localStorage.setItem(`shopping-list-${userId}`, JSON.stringify({ list, weekLabel, mealPlanHash, committedAt: new Date().toISOString(), checkedItems: [] }))
}

export function loadShoppingList(userId) {
  try { const s = localStorage.getItem(`shopping-list-${userId}`); return s ? JSON.parse(s) : null }
  catch (e) { return null }
}

export function updateCheckedItems(userId, checkedItems) {
  try {
    const s = localStorage.getItem(`shopping-list-${userId}`)
    if (s) { const d = JSON.parse(s); d.checkedItems = checkedItems; localStorage.setItem(`shopping-list-${userId}`, JSON.stringify(d)) }
  } catch (e) {}
}

export function clearShoppingList(userId) {
  try {
    localStorage.removeItem(`shopping-list-${userId}`)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Print ingredient breakdown to console for debugging
 * @param {Object} shoppingList - Shopping list with sources (from generateShoppingListWithBreakdown)
 */
export function printIngredientBreakdown(shoppingList) {
  console.group('📋 Ingredient Breakdown by Recipe/Day')

  Object.entries(shoppingList).forEach(([category, items]) => {
    if (items.length === 0) return

    console.group(`📦 ${CATEGORY_LABELS[category] || category}`)
    items.forEach(item => {
      if (!item.sources) {
        console.log(`${item.name}: ${item.grams}g ${item.hint || ''}`)
        return
      }

      console.group(`${item.name}: ${item.grams}g ${item.hint || ''}`)
      item.sources.forEach(src => {
        const dateLabel = new Date(src.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
        console.log(`  └─ ${dateLabel} | ${src.mealType} | ${src.recipe}: ${src.grams}g`)
      })
      console.groupEnd()
    })
    console.groupEnd()
  })

  console.groupEnd()
}
