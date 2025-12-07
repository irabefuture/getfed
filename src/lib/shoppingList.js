/**
 * Shopping List utilities
 *
 * Supports household mode where:
 * - Each member has individual portion multipliers
 * - Shopping quantities aggregate all members' needs
 * - Example: Chicken 200g base × 2.31 household multiplier = 462g to buy
 */

import { calculateHouseholdServings } from './smartPlanner'

const CATEGORY_MAP = {
  'capsicum': 'produce', 'tomato': 'produce', 'cucumber': 'produce',
  'spinach': 'produce', 'kale': 'produce', 'lettuce': 'produce',
  'rocket': 'produce', 'avocado': 'produce', 'onion': 'produce',
  'garlic': 'produce', 'ginger': 'produce', 'carrot': 'produce',
  'celery': 'produce', 'broccoli': 'produce', 'cauliflower': 'produce',
  'zucchini': 'produce', 'eggplant': 'produce', 'mushroom': 'produce',
  'asparagus': 'produce', 'beans': 'produce', 'peas': 'produce',
  'cabbage': 'produce', 'lemon': 'produce', 'lime': 'produce',
  'blueberries': 'produce', 'strawberries': 'produce', 'raspberries': 'produce',
  'apple': 'produce', 'banana': 'produce', 'orange': 'produce',
  'chicken': 'meat', 'beef': 'meat', 'lamb': 'meat', 'pork': 'meat',
  'turkey': 'meat', 'bacon': 'meat', 'mince': 'meat',
  'salmon': 'seafood', 'tuna': 'seafood', 'prawns': 'seafood',
  'fish': 'seafood', 'cod': 'seafood', 'barramundi': 'seafood',
  'eggs': 'dairy', 'egg': 'dairy', 'milk': 'dairy', 'cream': 'dairy',
  'cheese': 'dairy', 'feta': 'dairy', 'parmesan': 'dairy', 'cheddar': 'dairy',
  'mozzarella': 'dairy', 'yoghurt': 'dairy', 'yogurt': 'dairy',
  'butter': 'dairy', 'cottage': 'dairy', 'ricotta': 'dairy',
  'almond': 'pantry', 'walnut': 'pantry', 'pecan': 'pantry',
  'macadamia': 'pantry', 'cashew': 'pantry', 'coconut': 'pantry',
  'chia': 'pantry', 'flax': 'pantry', 'hemp': 'pantry',
  'vinegar': 'pantry', 'mustard': 'pantry', 'mayonnaise': 'pantry',
  'stock': 'pantry', 'broth': 'pantry', 'sauce': 'pantry',
  'flour': 'pantry', 'collagen': 'pantry', 'protein powder': 'pantry',
}

const PANTRY_STAPLES = ['salt', 'pepper', 'black pepper', 'olive oil', 'water', 'ice']

const UNIT_HINTS = {
  'egg': (g) => `~${Math.ceil(g / 50)} eggs`,
  'avocado': (g) => `~${Math.ceil(g / 150)} whole`,
  'capsicum': (g) => `~${Math.ceil(g / 150)} medium`,
  'tomato': (g) => `~${Math.ceil(g / 150)} medium`,
  'onion': (g) => `~${Math.ceil(g / 150)} medium`,
  'cucumber': (g) => `~${Math.ceil(g / 200)} whole`,
  'lemon': (g) => `~${Math.ceil(g / 60)} whole`,
  'lime': (g) => `~${Math.ceil(g / 45)} whole`,
  'garlic': (g) => `~${Math.ceil(g / 5)} cloves`,
  'chicken breast': (g) => `~${Math.ceil(g / 200)} breasts`,
  'salmon': (g) => `~${Math.ceil(g / 180)} fillets`,
  'banana': (g) => `~${Math.ceil(g / 120)} whole`,
}

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
  for (const [k, v] of Object.entries(CATEGORY_MAP)) { if (n.includes(k)) return v }
  return 'other'
}

function isStaple(name) {
  const n = name.toLowerCase()
  return PANTRY_STAPLES.some(s => n.includes(s))
}

function getHint(name, grams) {
  const n = name.toLowerCase()
  for (const [k, fn] of Object.entries(UNIT_HINTS)) { if (n.includes(k)) return fn(grams) }
  return null
}

/**
 * Generate shopping list from meal plan
 * @param {Object} meals - Meals keyed by date, then by meal type
 * @param {Array} dateKeys - Array of date keys to include
 * @param {number|Array} servingsOrMembers - Either a simple multiplier OR array of household members
 * @returns {Object} Grouped shopping list by category
 */
export function generateShoppingList(meals, dateKeys, servingsOrMembers = 1) {
  const map = {}

  // Determine if we're in household mode (array of members) or simple mode (number)
  const isHouseholdMode = Array.isArray(servingsOrMembers)
  const members = isHouseholdMode ? servingsOrMembers : null
  const simpleMultiplier = isHouseholdMode ? 1 : servingsOrMembers

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

      recipe.ingredients.forEach(ing => {
        if (isStaple(ing.name)) return
        const key = normalizeIngredientName(ing.name)
        const g = (ing.grams || 0) * multiplier

        if (map[key]) {
          map[key].grams += g
          if (!map[key].names.includes(ing.name)) {
            map[key].names.push(ing.name)
          }
        } else {
          map[key] = {
            names: [ing.name],
            grams: g,
            category: getCategory(ing.name)
          }
        }
      })
    })
  })

  const items = Object.entries(map).map(([k, v]) => ({
    name: v.names.sort((a, b) => a.length - b.length)[0],
    grams: Math.round(v.grams),
    category: v.category,
    hint: getHint(k, v.grams)
  }))

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
 * Generate shopping list for a household (convenience wrapper)
 * @param {Object} meals - Meals keyed by date
 * @param {Array} dateKeys - Date keys to include
 * @param {Array} members - Household members array
 * @returns {Object} Grouped shopping list
 */
export function generateHouseholdShoppingList(meals, dateKeys, members) {
  return generateShoppingList(meals, dateKeys, members)
}

export function generateMealPlanHash(meals, dateKeys) {
  const ids = []
  dateKeys.forEach(dk => {
    const day = meals[dk] || {}
    Object.keys(day).sort().forEach(slot => { if (day[slot]?.id) ids.push(`${dk}:${slot}:${day[slot].id}`) })
  })
  return ids.sort().join('|')
}

export const CATEGORY_LABELS = { produce: 'Produce', meat: 'Meat', seafood: 'Seafood', dairy: 'Dairy & Eggs', pantry: 'Pantry', other: 'Other' }

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
