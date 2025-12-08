/**
 * Ingredient Formatting Utilities
 *
 * Handles:
 * 1. US to AU ingredient name conversion
 * 2. Practical measurement display (tsp/tbsp for small quantities)
 */

// US to AU ingredient mappings (beyond the JSON file - cooking-specific)
const US_TO_AU_INGREDIENTS = {
  'pumpkin pie spice': 'mixed spice (or cinnamon)',
  'pumpkin spice': 'mixed spice (or cinnamon)',
  'italian seasoning': 'mixed herbs',
  'ranch dressing': 'whole egg mayonnaise',
  'turkey bacon': 'bacon rashers',
  'string cheese': 'cheese sticks',
  'primal kitchen bbq sauce': 'BBQ sauce',
  'kosher salt': 'cooking salt',
  'table salt': 'salt',
  'sea salt': 'salt',
  'light soy sauce': 'soy sauce',
  'tamari soy sauce': 'tamari',
  'canola oil': 'vegetable oil',
  'vegetable shortening': 'copha or vegetable oil',
  'molasses': 'treacle',
  'light corn syrup': 'golden syrup',
  'dark corn syrup': 'treacle',
  'half and half': 'light cream',
  'heavy cream': 'thickened cream',
  'whipping cream': 'thickened cream',
  'sour cream': 'sour cream',
  'crème fraîche': 'sour cream',
  'cream cheese': 'cream cheese',
  'neufchâtel': 'light cream cheese',
  'stick butter': 'butter',
  'cool whip': 'whipped cream',
  'graham cracker': 'digestive biscuit',
  'vanilla wafer': 'vanilla biscuit',
  'confectioners sugar': 'icing sugar',
  'powdered sugar': 'icing sugar',
  'superfine sugar': 'caster sugar',
  'granulated sugar': 'white sugar',
  'all purpose flour': 'plain flour',
  'bread flour': 'strong flour',
  'cake flour': 'self-raising flour',
  'baking soda': 'bicarbonate of soda',
  'cilantro': 'coriander',
  'arugula': 'rocket',
  'scallion': 'spring onion',
  'green onion': 'spring onion',
  'bell pepper': 'capsicum',
  'red bell pepper': 'red capsicum',
  'green bell pepper': 'green capsicum',
  'yellow bell pepper': 'yellow capsicum',
  'eggplant': 'eggplant',
  'zucchini': 'zucchini',
  'romaine lettuce': 'cos lettuce',
  'bibb lettuce': 'butter lettuce',
  'shrimp': 'prawns',
  'jumbo shrimp': 'king prawns',
  'crawfish': 'yabbies',
  'ground beef': 'beef mince',
  'ground lamb': 'lamb mince',
  'ground pork': 'pork mince',
  'ground chicken': 'chicken mince',
  'ground turkey': 'turkey mince',
}

// Ingredients that should display in practical measurements (tsp/tbsp)
// These are typically spices, seasonings, extracts where grams are impractical
const SMALL_QUANTITY_INGREDIENTS = [
  // Spices and seasonings
  'salt', 'pepper', 'black pepper', 'white pepper', 'cayenne',
  'paprika', 'smoked paprika', 'cumin', 'coriander', 'turmeric',
  'cinnamon', 'nutmeg', 'allspice', 'cloves', 'ginger',
  'garlic powder', 'onion powder', 'chili powder', 'chilli powder',
  'curry powder', 'garam masala', 'mixed spice', 'pumpkin pie spice',
  'oregano', 'basil', 'thyme', 'rosemary', 'sage', 'dill',
  'parsley', 'chives', 'tarragon', 'bay leaf', 'bay leaves',
  'red pepper flakes', 'chili flakes', 'italian seasoning', 'mixed herbs',
  'mustard powder', 'celery salt', 'garlic salt',

  // Extracts and flavourings
  'vanilla extract', 'vanilla essence', 'almond extract',
  'lemon extract', 'peppermint extract', 'coconut extract',

  // Sweeteners (small quantities)
  'stevia', 'monk fruit', 'erythritol',

  // Liquids used in small amounts
  'fish sauce', 'soy sauce', 'tamari', 'worcestershire sauce',
  'hot sauce', 'tabasco', 'sriracha',
  'lemon juice', 'lime juice', 'vinegar', 'balsamic vinegar',
  'apple cider vinegar', 'rice vinegar', 'white wine vinegar',

  // Oils used in small amounts (for dressings/drizzling)
  'sesame oil', 'chili oil', 'truffle oil',

  // Pastes
  'tomato paste', 'miso paste', 'harissa', 'gochujang',
  'anchovy paste', 'wasabi',

  // Baking
  'baking powder', 'baking soda', 'bicarbonate of soda',
  'cream of tartar', 'yeast', 'gelatin',
]

// Density factors (grams per teaspoon) for common ingredients
// Used to convert grams to teaspoons/tablespoons
const DENSITY_TSP = {
  // Spices (ground) - most are ~2-3g per tsp
  'salt': 6,
  'pepper': 2.3,
  'black pepper': 2.3,
  'white pepper': 2.3,
  'paprika': 2.3,
  'smoked paprika': 2.3,
  'cinnamon': 2.6,
  'nutmeg': 2.2,
  'cumin': 2.1,
  'turmeric': 3,
  'ginger': 1.8,
  'garlic powder': 2.8,
  'onion powder': 2.4,
  'cayenne': 1.8,
  'chili powder': 2.5,
  'chilli powder': 2.5,
  'curry powder': 2,
  'mixed spice': 2.3,
  'pumpkin pie spice': 2.3,
  'oregano': 1.5,
  'basil': 1.4,
  'thyme': 1.4,
  'rosemary': 1.2,
  'dill': 1,
  'parsley': 0.5,
  'red pepper flakes': 1.5,
  'chili flakes': 1.5,
  'italian seasoning': 1.5,
  'mixed herbs': 1.5,
  'mustard powder': 3,

  // Extracts - liquid, ~5ml per tsp
  'vanilla extract': 4.2,
  'vanilla essence': 4.2,
  'almond extract': 4.2,
  'lemon extract': 4.2,

  // Sweeteners
  'stevia': 0.5, // Very light
  'monk fruit': 0.5,
  'erythritol': 4,

  // Liquids (~5ml = 5g for water-like, denser for syrups/sauces)
  'soy sauce': 5,
  'tamari': 5,
  'fish sauce': 5.5,
  'worcestershire sauce': 5.5,
  'hot sauce': 5,
  'lemon juice': 5,
  'lime juice': 5,
  'vinegar': 5,
  'balsamic vinegar': 5.5,
  'apple cider vinegar': 5,
  'rice vinegar': 5,
  'sesame oil': 4.5,

  // Pastes
  'tomato paste': 5.5,
  'miso paste': 6,
  'harissa': 5,

  // Baking
  'baking powder': 4.6,
  'baking soda': 4.6,
  'bicarbonate of soda': 4.6,
  'cream of tartar': 3,
  'yeast': 3,

  // Default for unknown spices
  'default': 2.5,
}

/**
 * Check if ingredient should use practical measurements
 */
function shouldUsePracticalMeasure(name) {
  const lower = name.toLowerCase()
  return SMALL_QUANTITY_INGREDIENTS.some(ing => lower.includes(ing))
}

/**
 * Convert grams to practical measurement (tsp/tbsp)
 */
function gramsToPractical(grams, ingredientName) {
  const lower = ingredientName.toLowerCase()

  // Find the matching density
  let density = DENSITY_TSP.default
  for (const [key, value] of Object.entries(DENSITY_TSP)) {
    if (lower.includes(key)) {
      density = value
      break
    }
  }

  const teaspoons = grams / density

  // Format nicely
  if (teaspoons < 0.2) {
    return 'pinch'
  } else if (teaspoons <= 0.3) {
    return '1/4 tsp'
  } else if (teaspoons <= 0.6) {
    return '1/2 tsp'
  } else if (teaspoons <= 0.85) {
    return '3/4 tsp'
  } else if (teaspoons <= 1.25) {
    return '1 tsp'
  } else if (teaspoons <= 1.75) {
    return '1 1/2 tsp'
  } else if (teaspoons <= 2.25) {
    return '2 tsp'
  } else if (teaspoons <= 3.5) {
    return '1 tbsp'
  } else if (teaspoons <= 4.5) {
    return '1 1/2 tbsp'
  } else if (teaspoons <= 6.5) {
    return '2 tbsp'
  } else if (teaspoons <= 9.5) {
    return '3 tbsp'
  } else if (teaspoons <= 12.5) {
    return '1/4 cup'
  } else if (teaspoons <= 25) {
    return '1/3 cup'
  } else if (teaspoons <= 37) {
    return '1/2 cup'
  } else {
    // For larger quantities, show cups
    const cups = teaspoons / 48 // 48 tsp per AU cup (approx)
    return `${cups.toFixed(1)} cups`
  }
}

/**
 * Convert US ingredient name to AU equivalent
 */
export function toAustralianName(name) {
  const lower = name.toLowerCase()

  // Check for exact or partial match in mapping
  for (const [us, au] of Object.entries(US_TO_AU_INGREDIENTS)) {
    if (lower === us || lower.includes(us)) {
      // Preserve original capitalisation style if possible
      if (name[0] === name[0].toUpperCase()) {
        return au.charAt(0).toUpperCase() + au.slice(1)
      }
      return au
    }
  }

  return name
}

/**
 * Format ingredient quantity for display
 * Returns practical measurement for small quantities, grams for larger
 */
export function formatQuantity(grams, ingredientName) {
  if (!grams || grams === 0) return ''

  // Check if this ingredient should use practical measurements
  if (shouldUsePracticalMeasure(ingredientName) && grams < 30) {
    return gramsToPractical(grams, ingredientName)
  }

  // For larger quantities, show grams (rounded nicely)
  const rounded = grams < 10 ? Math.round(grams * 10) / 10 : Math.round(grams)
  return `${rounded}g`
}

/**
 * Format a full ingredient line for recipe display
 * Combines AU name conversion + practical measurements
 */
export function formatIngredient(ingredient) {
  const { name, grams, notes, optional } = ingredient

  // Convert to AU name
  const auName = toAustralianName(name)

  // Format quantity
  const qty = formatQuantity(grams, name)

  // Build display string
  let display = auName
  if (qty) {
    display += ` (${qty})`
  }

  return {
    name: auName,
    quantity: qty,
    display,
    notes,
    optional,
  }
}

/**
 * Format ingredient for simple display (name + quantity only)
 */
export function formatIngredientSimple(name, grams) {
  const auName = toAustralianName(name)
  const qty = formatQuantity(grams, name)
  return qty ? `${auName} (${qty})` : auName
}
