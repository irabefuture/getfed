#!/usr/bin/env node
/**
 * Recipe Ingredient Serving Size Validator
 *
 * Scans all recipes and validates per-serve ingredient amounts
 * against reasonable Australian serving size standards.
 *
 * Usage: node scripts/validate-serving-sizes.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SERVING SIZE STANDARDS (grams per serve)
// ============================================================================

// Ingredients to skip validation (not nutritionally relevant)
const SKIP_INGREDIENTS = [
  'ice',
  'ice-cubes',
  'crushed-ice',
  'water',
];

const SERVING_STANDARDS = {
  // PROTEINS
  'salmon': { min: 120, max: 180, category: 'protein' },
  'fish': { min: 120, max: 180, category: 'protein' },
  'barramundi': { min: 120, max: 180, category: 'protein' },
  'snapper': { min: 120, max: 180, category: 'protein' },
  'cod': { min: 120, max: 180, category: 'protein' },
  'tuna': { min: 120, max: 180, category: 'protein' },
  'prawns': { min: 100, max: 150, category: 'protein' },
  'chicken': { min: 120, max: 180, category: 'protein' },
  'chicken-breast': { min: 120, max: 180, category: 'protein' },
  'chicken-thigh': { min: 120, max: 180, category: 'protein' },
  'turkey': { min: 120, max: 180, category: 'protein' },
  'turkey-mince': { min: 100, max: 150, category: 'protein' },
  'beef': { min: 120, max: 180, category: 'protein' },
  'beef-mince': { min: 100, max: 150, category: 'protein' },
  'steak': { min: 150, max: 250, category: 'protein' },
  'lamb': { min: 120, max: 180, category: 'protein' },
  'pork': { min: 120, max: 180, category: 'protein' },
  'pork-loin': { min: 120, max: 180, category: 'protein' },
  'pork-mince': { min: 100, max: 150, category: 'protein' },
  'bacon': { min: 30, max: 60, category: 'protein' },
  'bacon-rashers': { min: 30, max: 60, category: 'protein' },
  'prosciutto': { min: 20, max: 50, category: 'protein' },
  'eggs': { min: 50, max: 120, category: 'protein' },
  'egg': { min: 50, max: 120, category: 'protein' },
  'tofu': { min: 80, max: 150, category: 'protein' },
  'tempeh': { min: 80, max: 150, category: 'protein' },

  // VEGETABLES - Leafy greens
  'lettuce': { min: 30, max: 60, category: 'vegetable-leafy' },
  'spinach': { min: 30, max: 80, category: 'vegetable-leafy' },
  'rocket': { min: 20, max: 50, category: 'vegetable-leafy' },
  'kale': { min: 30, max: 80, category: 'vegetable-leafy' },
  'mixed-greens': { min: 30, max: 80, category: 'vegetable-leafy' },
  'baby-spinach': { min: 30, max: 80, category: 'vegetable-leafy' },
  'cos-lettuce': { min: 30, max: 60, category: 'vegetable-leafy' },
  'iceberg-lettuce': { min: 30, max: 60, category: 'vegetable-leafy' },

  // VEGETABLES - Cruciferous
  'broccoli': { min: 80, max: 150, category: 'vegetable-cruciferous' },
  'cauliflower': { min: 80, max: 150, category: 'vegetable-cruciferous' },
  'cauliflower-rice': { min: 100, max: 200, category: 'vegetable-cruciferous' },
  'brussels-sprouts': { min: 80, max: 150, category: 'vegetable-cruciferous' },
  'cabbage': { min: 60, max: 120, category: 'vegetable-cruciferous' },

  // VEGETABLES - Other
  'zucchini': { min: 100, max: 200, category: 'vegetable' },
  'squash': { min: 100, max: 200, category: 'vegetable' },
  'butternut-squash': { min: 100, max: 200, category: 'vegetable' },
  'pumpkin': { min: 100, max: 200, category: 'vegetable' },
  'eggplant': { min: 100, max: 200, category: 'vegetable' },
  'tomatoes': { min: 50, max: 150, category: 'vegetable' },
  'tomato': { min: 50, max: 150, category: 'vegetable' },
  'cherry-tomatoes': { min: 50, max: 150, category: 'vegetable' },
  'capsicum': { min: 80, max: 150, category: 'vegetable' },
  'cucumber': { min: 50, max: 120, category: 'vegetable' },
  'celery': { min: 30, max: 80, category: 'vegetable' },
  'carrot': { min: 50, max: 120, category: 'vegetable' },
  'carrots': { min: 50, max: 120, category: 'vegetable' },
  'green-beans': { min: 60, max: 120, category: 'vegetable' },
  'asparagus': { min: 60, max: 120, category: 'vegetable' },
  'mushrooms': { min: 50, max: 120, category: 'vegetable' },
  'onion': { min: 30, max: 80, category: 'vegetable' },
  'red-onion': { min: 30, max: 80, category: 'vegetable' },
  'spring-onion': { min: 10, max: 30, category: 'vegetable' },
  'leek': { min: 50, max: 100, category: 'vegetable' },

  // VEGETABLES - Specialty
  'avocado': { min: 50, max: 100, category: 'vegetable' },
  'olives': { min: 15, max: 40, category: 'vegetable' },
  'artichoke': { min: 50, max: 100, category: 'vegetable' },
  'sun-dried-tomatoes': { min: 15, max: 40, category: 'vegetable' },

  // DAIRY
  'cheese': { min: 20, max: 50, category: 'dairy' },
  'cheddar': { min: 20, max: 50, category: 'dairy' },
  'parmesan': { min: 10, max: 30, category: 'dairy' },
  'feta': { min: 20, max: 60, category: 'dairy' },
  'mozzarella': { min: 30, max: 80, category: 'dairy' },
  'cream-cheese': { min: 20, max: 60, category: 'dairy' },
  'goat-cheese': { min: 20, max: 50, category: 'dairy' },
  'ricotta': { min: 40, max: 100, category: 'dairy' },
  'butter': { min: 10, max: 30, category: 'dairy' },
  'ghee': { min: 10, max: 30, category: 'dairy' },
  'cream': { min: 30, max: 120, category: 'dairy' },
  'thickened-cream': { min: 30, max: 120, category: 'dairy' },
  'heavy-cream': { min: 30, max: 120, category: 'dairy' },
  'sour-cream': { min: 20, max: 60, category: 'dairy' },
  'milk': { min: 30, max: 250, category: 'dairy' },
  'coconut-milk': { min: 50, max: 200, category: 'dairy' },
  'coconut-cream': { min: 30, max: 100, category: 'dairy' },
  'greek-yoghurt': { min: 100, max: 200, category: 'dairy' },
  'yoghurt': { min: 100, max: 200, category: 'dairy' },

  // FATS & OILS
  'olive-oil': { min: 10, max: 30, category: 'oil' },
  'extra-virgin-olive-oil': { min: 10, max: 30, category: 'oil' },
  'avocado-oil': { min: 10, max: 30, category: 'oil' },
  'coconut-oil': { min: 10, max: 30, category: 'oil' },
  'sesame-oil': { min: 5, max: 15, category: 'oil' },

  // CONDIMENTS & SAUCES
  'mayonnaise': { min: 15, max: 45, category: 'condiment' },
  'mayo': { min: 15, max: 45, category: 'condiment' },
  'aioli': { min: 15, max: 45, category: 'condiment' },
  'mustard': { min: 5, max: 20, category: 'condiment' },
  'dijon-mustard': { min: 5, max: 20, category: 'condiment' },
  'pesto': { min: 15, max: 40, category: 'condiment' },
  'salsa': { min: 30, max: 60, category: 'condiment' },
  'hot-sauce': { min: 5, max: 15, category: 'condiment' },
  'soy-sauce': { min: 10, max: 30, category: 'condiment' },
  'tamari': { min: 10, max: 30, category: 'condiment' },
  'fish-sauce': { min: 5, max: 15, category: 'condiment' },
  'worcestershire': { min: 5, max: 15, category: 'condiment' },
  'balsamic-vinegar': { min: 10, max: 30, category: 'condiment' },
  'apple-cider-vinegar': { min: 10, max: 30, category: 'condiment' },
  'red-wine-vinegar': { min: 10, max: 30, category: 'condiment' },
  'lemon-juice': { min: 10, max: 40, category: 'condiment' },
  'lime-juice': { min: 10, max: 30, category: 'condiment' },

  // SWEETENERS
  'honey': { min: 10, max: 30, category: 'sweetener' },
  'maple-syrup': { min: 10, max: 30, category: 'sweetener' },
  'stevia': { min: 1, max: 5, category: 'sweetener' },

  // NUTS & SEEDS
  'almonds': { min: 15, max: 40, category: 'nuts' },
  'walnuts': { min: 15, max: 40, category: 'nuts' },
  'pecans': { min: 15, max: 40, category: 'nuts' },
  'cashews': { min: 15, max: 40, category: 'nuts' },
  'macadamias': { min: 15, max: 40, category: 'nuts' },
  'pine-nuts': { min: 10, max: 25, category: 'nuts' },
  'peanuts': { min: 15, max: 40, category: 'nuts' },
  'almond-butter': { min: 15, max: 35, category: 'nuts' },
  'peanut-butter': { min: 15, max: 35, category: 'nuts' },
  'chia-seeds': { min: 10, max: 25, category: 'seeds' },
  'flaxseed': { min: 5, max: 20, category: 'seeds' },
  'hemp-hearts': { min: 10, max: 25, category: 'seeds' },
  'pumpkin-seeds': { min: 15, max: 35, category: 'seeds' },
  'sunflower-seeds': { min: 15, max: 35, category: 'seeds' },
  'sesame-seeds': { min: 5, max: 20, category: 'seeds' },

  // AROMATICS & HERBS (small amounts)
  'garlic': { min: 2, max: 15, category: 'aromatic' },
  'ginger': { min: 3, max: 15, category: 'aromatic' },
  'fresh-herbs': { min: 5, max: 20, category: 'aromatic' },
  'basil': { min: 3, max: 15, category: 'aromatic' },
  'parsley': { min: 5, max: 20, category: 'aromatic' },
  'coriander': { min: 5, max: 20, category: 'aromatic' },
  'mint': { min: 3, max: 15, category: 'aromatic' },
  'rosemary': { min: 2, max: 10, category: 'aromatic' },
  'thyme': { min: 2, max: 10, category: 'aromatic' },
  'dill': { min: 3, max: 15, category: 'aromatic' },
  'chives': { min: 3, max: 15, category: 'aromatic' },

  // FRUITS
  'berries': { min: 40, max: 120, category: 'fruit' },
  'blueberries': { min: 30, max: 100, category: 'fruit' },
  'strawberries': { min: 40, max: 120, category: 'fruit' },
  'raspberries': { min: 30, max: 100, category: 'fruit' },
  'blackberries': { min: 30, max: 100, category: 'fruit' },
  'lemon': { min: 20, max: 60, category: 'fruit' },
  'lime': { min: 15, max: 40, category: 'fruit' },
  'orange': { min: 80, max: 150, category: 'fruit' },
  'apple': { min: 80, max: 150, category: 'fruit' },
  'banana': { min: 80, max: 150, category: 'fruit' },

  // COCONUT PRODUCTS
  'coconut-flakes': { min: 5, max: 20, category: 'coconut' },
  'shredded-coconut': { min: 5, max: 20, category: 'coconut' },
  'desiccated-coconut': { min: 5, max: 20, category: 'coconut' },
  'coconut-flour': { min: 10, max: 30, category: 'coconut' },

  // PROTEIN POWDER
  'protein-powder': { min: 20, max: 40, category: 'supplement' },
  'collagen': { min: 10, max: 25, category: 'supplement' },
  'collagen-peptides': { min: 10, max: 25, category: 'supplement' },

  // MISC
  'capers': { min: 5, max: 20, category: 'misc' },
  'anchovies': { min: 10, max: 30, category: 'misc' },
  'stock': { min: 100, max: 300, category: 'misc' },
  'chicken-stock': { min: 100, max: 300, category: 'misc' },
  'beef-stock': { min: 100, max: 300, category: 'misc' },
  'vegetable-stock': { min: 100, max: 300, category: 'misc' },
  'bone-broth': { min: 100, max: 300, category: 'misc' },
  'almond-milk': { min: 100, max: 250, category: 'misc' },
  'oat-milk': { min: 100, max: 250, category: 'misc' },
  'cocoa-powder': { min: 5, max: 20, category: 'misc' },
  'cacao-powder': { min: 5, max: 20, category: 'misc' },
  'dark-chocolate': { min: 15, max: 40, category: 'misc' },
};

// Ingredient name mapping for fuzzy matching
const INGREDIENT_ALIASES = {
  // Proteins
  'boneless pork loin': 'pork-loin',
  'pork loin': 'pork-loin',
  'chicken breast': 'chicken-breast',
  'chicken thigh': 'chicken-thigh',
  'chicken thighs': 'chicken-thigh',
  'beef mince': 'beef-mince',
  'turkey mince': 'turkey-mince',
  'ground turkey': 'turkey-mince',
  'ground beef': 'beef-mince',
  'bacon rashers': 'bacon',
  'streaky bacon': 'bacon',
  'eggs': 'egg',
  'large eggs': 'egg',
  'large egg': 'egg',
  'salmon fillet': 'salmon',
  'atlantic salmon': 'salmon',
  'smoked salmon': 'salmon',

  // Dairy
  'plain full-fat greek yoghurt': 'greek-yoghurt',
  'greek yoghurt': 'greek-yoghurt',
  'full-fat greek yoghurt': 'greek-yoghurt',
  'cheddar cheese': 'cheddar',
  'shredded cheddar': 'cheddar',
  'grated parmesan': 'parmesan',
  'parmesan cheese': 'parmesan',
  'feta cheese': 'feta',
  'crumbled feta': 'feta',
  'mozzarella cheese': 'mozzarella',
  'unsalted butter': 'butter',
  'salted butter': 'butter',
  'thickened cream': 'cream',
  'heavy cream': 'cream',
  'double cream': 'cream',
  'pouring cream': 'cream',
  'full-fat coconut milk': 'coconut-milk',

  // Vegetables
  'fresh spinach': 'spinach',
  'baby spinach': 'spinach',
  'cos lettuce': 'lettuce',
  'romaine lettuce': 'lettuce',
  'iceberg lettuce': 'lettuce',
  'broccoli florets': 'broccoli',
  'cauliflower florets': 'cauliflower',
  'riced cauliflower': 'cauliflower-rice',
  'cauliflower rice': 'cauliflower-rice',
  'red capsicum': 'capsicum',
  'green capsicum': 'capsicum',
  'yellow capsicum': 'capsicum',
  'bell pepper': 'capsicum',
  'red onion': 'onion',
  'brown onion': 'onion',
  'white onion': 'onion',
  'yellow onion': 'onion',
  'spring onions': 'spring-onion',
  'green onions': 'spring-onion',
  'shallots': 'spring-onion',
  'fresh green beans': 'green-beans',
  'button mushrooms': 'mushrooms',
  'swiss brown mushrooms': 'mushrooms',
  'cremini mushrooms': 'mushrooms',
  'portobello mushrooms': 'mushrooms',
  'cherry tomatoes': 'tomato',
  'grape tomatoes': 'tomato',
  'roma tomatoes': 'tomato',
  'diced tomatoes': 'tomato',
  'tinned tomatoes': 'tomato',
  'crushed tomatoes': 'tomato',
  'ripe avocado': 'avocado',
  'hass avocado': 'avocado',
  'lebanese cucumber': 'cucumber',
  'continental cucumber': 'cucumber',

  // Oils & Fats
  'extra virgin olive oil': 'olive-oil',
  'evoo': 'olive-oil',
  'coconut oil': 'coconut-oil',
  'virgin coconut oil': 'coconut-oil',
  'avocado oil': 'avocado-oil',
  'toasted sesame oil': 'sesame-oil',

  // Nuts & Seeds
  'raw almonds': 'almonds',
  'whole almonds': 'almonds',
  'sliced almonds': 'almonds',
  'flaked almonds': 'almonds',
  'raw walnuts': 'walnuts',
  'walnut halves': 'walnuts',
  'raw cashews': 'cashews',
  'ground flaxseed': 'flaxseed',
  'flax meal': 'flaxseed',
  'linseed': 'flaxseed',
  'chia seeds': 'chia-seeds',
  'hemp seeds': 'hemp-hearts',
  'pepitas': 'pumpkin-seeds',

  // Aromatics
  'fresh garlic': 'garlic',
  'garlic cloves': 'garlic',
  'minced garlic': 'garlic',
  'fresh ginger': 'ginger',
  'grated ginger': 'ginger',
  'minced ginger': 'ginger',
  'fresh basil': 'basil',
  'fresh parsley': 'parsley',
  'flat-leaf parsley': 'parsley',
  'fresh coriander': 'coriander',
  'cilantro': 'coriander',
  'fresh mint': 'mint',
  'fresh rosemary': 'rosemary',
  'fresh thyme': 'thyme',
  'fresh dill': 'dill',
  'fresh chives': 'chives',

  // Condiments
  'dijon mustard': 'mustard',
  'wholegrain mustard': 'mustard',
  'soy sauce': 'tamari',
  'reduced-sodium soy sauce': 'tamari',
  'coconut aminos': 'tamari',
  'fresh lemon juice': 'lemon-juice',
  'fresh lime juice': 'lime-juice',
  'balsamic vinegar': 'balsamic-vinegar',
  'apple cider vinegar': 'apple-cider-vinegar',
  'red wine vinegar': 'red-wine-vinegar',
  'white wine vinegar': 'red-wine-vinegar',

  // Sweeteners
  'raw honey': 'honey',
  'pure maple syrup': 'maple-syrup',

  // Fruits
  'fresh strawberries': 'strawberries',
  'fresh blueberries': 'blueberries',
  'fresh raspberries': 'raspberries',
  'mixed berries': 'berries',
  'fresh lemon': 'lemon',
  'lemon zest': 'lemon',
  'fresh lime': 'lime',
  'lime zest': 'lime',

  // Coconut
  'unsweetened coconut flakes': 'coconut-flakes',
  'shredded coconut': 'coconut-flakes',
  'desiccated coconut': 'coconut-flakes',

  // Misc
  'chicken stock': 'stock',
  'beef stock': 'stock',
  'vegetable stock': 'stock',
  'bone broth': 'stock',
  'unsweetened almond milk': 'almond-milk',
  'vanilla protein powder': 'protein-powder',
  'whey protein': 'protein-powder',
  'collagen peptides': 'collagen',
  'unsweetened cocoa powder': 'cocoa-powder',
  'cacao powder': 'cocoa-powder',
  'kalamata olives': 'olives',
  'black olives': 'olives',
  'green olives': 'olives',
  'sun-dried tomatoes': 'sun-dried-tomatoes',
};

// ============================================================================
// VALIDATOR FUNCTIONS
// ============================================================================

function normaliseIngredientId(name) {
  const lower = name.toLowerCase().trim();

  // Check aliases first
  if (INGREDIENT_ALIASES[lower]) {
    return INGREDIENT_ALIASES[lower];
  }

  // Try direct match
  const kebab = lower.replace(/\s+/g, '-');
  if (SERVING_STANDARDS[kebab]) {
    return kebab;
  }

  // Try partial matches
  for (const [key, standard] of Object.entries(SERVING_STANDARDS)) {
    if (lower.includes(key) || key.includes(lower.replace(/-/g, ' '))) {
      return key;
    }
  }

  return null;
}

function validateRecipe(recipe, filename) {
  const issues = [];
  const baseServings = recipe.base_servings || 1;

  for (const ingredient of recipe.ingredients || []) {
    const grams = ingredient.grams;
    const perServeGrams = grams / baseServings;

    // Try to match ingredient
    const standardKey = normaliseIngredientId(ingredient.name) || normaliseIngredientId(ingredient.id);

    if (!standardKey) {
      // Skip unknown ingredients but note them
      continue;
    }

    // Skip non-nutritional ingredients
    if (SKIP_INGREDIENTS.includes(standardKey) || SKIP_INGREDIENTS.includes(ingredient.id)) {
      continue;
    }

    const standard = SERVING_STANDARDS[standardKey];
    if (!standard) continue;

    // Check thresholds
    let severity = null;
    if (perServeGrams > standard.max * 2) {
      severity = 'CRITICAL';
    } else if (perServeGrams > standard.max * 1.5) {
      severity = 'HIGH';
    } else if (perServeGrams > standard.max) {
      severity = 'WARNING';
    } else if (perServeGrams < standard.min * 0.5) {
      severity = 'LOW';
    }

    if (severity) {
      issues.push({
        file: filename,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        base_servings: baseServings,
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.name,
        total_grams: grams,
        per_serve_grams: Math.round(perServeGrams * 10) / 10,
        expected_min: standard.min,
        expected_max: standard.max,
        category: standard.category,
        severity: severity,
        matched_standard: standardKey,
        suggested_grams: severity === 'CRITICAL' || severity === 'HIGH'
          ? Math.round(standard.max * baseServings)
          : null
      });
    }
  }

  return issues;
}

function loadRecipes(recipesDir) {
  const allRecipes = [];
  const files = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filepath = path.join(recipesDir, file);
    const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    if (content.recipes && Array.isArray(content.recipes)) {
      for (const recipe of content.recipes) {
        allRecipes.push({ recipe, filename: file });
      }
    }
  }

  return allRecipes;
}

function generateReport(issues) {
  // Sort by severity
  const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'WARNING': 2, 'LOW': 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  console.log('\n' + '='.repeat(120));
  console.log('RECIPE INGREDIENT SERVING SIZE VALIDATION REPORT');
  console.log('='.repeat(120) + '\n');

  // Summary
  const critical = issues.filter(i => i.severity === 'CRITICAL').length;
  const high = issues.filter(i => i.severity === 'HIGH').length;
  const warning = issues.filter(i => i.severity === 'WARNING').length;
  const low = issues.filter(i => i.severity === 'LOW').length;

  console.log('SUMMARY:');
  console.log(`  CRITICAL (>2x max): ${critical}`);
  console.log(`  HIGH (>1.5x max):   ${high}`);
  console.log(`  WARNING (>max):     ${warning}`);
  console.log(`  LOW (<0.5x min):    ${low}`);
  console.log(`  TOTAL:              ${issues.length}`);
  console.log('\n' + '-'.repeat(120) + '\n');

  // Table header
  const headers = ['File', 'Recipe', 'Ingredient', 'Per Serve', 'Expected', 'Severity'];
  const widths = [25, 35, 30, 12, 15, 10];

  console.log(headers.map((h, i) => h.padEnd(widths[i])).join('| '));
  console.log(widths.map(w => '-'.repeat(w)).join('+-'));

  // Table rows
  for (const issue of issues) {
    const file = issue.file.substring(0, widths[0] - 1);
    const recipe = issue.recipe_name.substring(0, widths[1] - 1);
    const ingredient = issue.ingredient_name.substring(0, widths[2] - 1);
    const perServe = `${issue.per_serve_grams}g`;
    const expected = `${issue.expected_min}-${issue.expected_max}g`;

    console.log([
      file.padEnd(widths[0]),
      recipe.padEnd(widths[1]),
      ingredient.padEnd(widths[2]),
      perServe.padEnd(widths[3]),
      expected.padEnd(widths[4]),
      issue.severity.padEnd(widths[5])
    ].join('| '));
  }

  console.log('\n' + '='.repeat(120) + '\n');

  return { critical, high, warning, low, total: issues.length };
}

function generateFixFile(issues, outputPath) {
  // Only include CRITICAL and HIGH issues
  const toFix = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');

  const fixes = toFix.map(issue => ({
    file: issue.file,
    recipe_id: issue.recipe_id,
    recipe_name: issue.recipe_name,
    ingredient_id: issue.ingredient_id,
    ingredient_name: issue.ingredient_name,
    current_total_grams: issue.total_grams,
    current_per_serve: issue.per_serve_grams,
    base_servings: issue.base_servings,
    expected_range: `${issue.expected_min}-${issue.expected_max}g per serve`,
    severity: issue.severity,
    suggested_total_grams: issue.suggested_grams,
    suggested_per_serve: issue.suggested_grams ? Math.round(issue.suggested_grams / issue.base_servings * 10) / 10 : null,
    action: 'REVIEW',
    notes: ''
  }));

  const output = {
    generated: new Date().toISOString(),
    description: 'Recipe ingredient fixes requiring review. Edit action/notes and run apply script.',
    summary: {
      critical: toFix.filter(f => f.severity === 'CRITICAL').length,
      high: toFix.filter(f => f.severity === 'HIGH').length,
      total: toFix.length
    },
    fixes: fixes
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Fix file written to: ${outputPath}`);
  console.log(`Contains ${fixes.length} items requiring review.\n`);
}

// ============================================================================
// MAIN
// ============================================================================

const recipesDir = path.join(__dirname, '..', 'data', 'recipes');
const outputPath = path.join(__dirname, 'serving-size-fixes.json');

console.log(`\nScanning recipes in: ${recipesDir}\n`);

const allRecipes = loadRecipes(recipesDir);
console.log(`Found ${allRecipes.length} recipes across all files.\n`);

const allIssues = [];
for (const { recipe, filename } of allRecipes) {
  const issues = validateRecipe(recipe, filename);
  allIssues.push(...issues);
}

const summary = generateReport(allIssues);
generateFixFile(allIssues, outputPath);

// Exit with code based on critical issues
process.exit(summary.critical > 0 ? 1 : 0);
