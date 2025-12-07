#!/usr/bin/env node
/**
 * Comprehensive Recipe Ingredient Validator
 *
 * Scans all recipes and validates per-serve ingredient amounts
 * against reasonable AU serving sizes.
 */

const fs = require('fs')
const path = require('path')

// AU serving size ranges (grams per serve)
const SERVING_RANGES = {
  // PROTEINS
  'salmon': { min: 120, max: 180, category: 'protein' },
  'fish': { min: 120, max: 180, category: 'protein' },
  'barramundi': { min: 120, max: 180, category: 'protein' },
  'tuna': { min: 80, max: 150, category: 'protein' },
  'prawns': { min: 100, max: 150, category: 'protein' },
  'chicken breast': { min: 120, max: 180, category: 'protein' },
  'chicken thigh': { min: 120, max: 180, category: 'protein' },
  'rotisserie chicken': { min: 80, max: 150, category: 'protein' },
  'beef mince': { min: 100, max: 150, category: 'protein' },
  'beef steak': { min: 150, max: 250, category: 'protein' },
  'beef sirloin': { min: 150, max: 250, category: 'protein' },
  'lamb': { min: 120, max: 180, category: 'protein' },
  'pork': { min: 120, max: 180, category: 'protein' },
  'bacon': { min: 30, max: 60, category: 'protein' },
  'turkey mince': { min: 100, max: 150, category: 'protein' },
  'egg': { min: 50, max: 120, category: 'protein' },  // 1-2 eggs
  'tofu': { min: 80, max: 150, category: 'protein' },
  'tempeh': { min: 80, max: 150, category: 'protein' },

  // VEGETABLES
  'spinach': { min: 30, max: 60, category: 'veg' },
  'rocket': { min: 30, max: 60, category: 'veg' },
  'lettuce': { min: 30, max: 80, category: 'veg' },
  'kale': { min: 30, max: 60, category: 'veg' },
  'mixed greens': { min: 30, max: 60, category: 'veg' },
  'broccoli': { min: 80, max: 150, category: 'veg' },
  'cauliflower': { min: 80, max: 200, category: 'veg' },
  'zucchini': { min: 100, max: 200, category: 'veg' },
  'squash': { min: 100, max: 200, category: 'veg' },
  'spaghetti squash': { min: 150, max: 300, category: 'veg' },
  'tomato': { min: 50, max: 150, category: 'veg' },
  'cherry tomato': { min: 50, max: 100, category: 'veg' },
  'grape tomato': { min: 50, max: 100, category: 'veg' },
  'avocado': { min: 50, max: 100, category: 'veg' },
  'capsicum': { min: 50, max: 120, category: 'veg' },
  'onion': { min: 30, max: 80, category: 'veg' },
  'garlic': { min: 3, max: 15, category: 'veg' },
  'carrot': { min: 40, max: 100, category: 'veg' },
  'celery': { min: 20, max: 60, category: 'veg' },
  'cucumber': { min: 50, max: 120, category: 'veg' },
  'mushroom': { min: 50, max: 150, category: 'veg' },
  'asparagus': { min: 60, max: 120, category: 'veg' },
  'green beans': { min: 60, max: 150, category: 'veg' },
  'beans': { min: 60, max: 150, category: 'veg' },
  'radish': { min: 30, max: 60, category: 'veg' },

  // DAIRY
  'cheese': { min: 20, max: 50, category: 'dairy' },
  'cheddar': { min: 20, max: 50, category: 'dairy' },
  'parmesan': { min: 10, max: 30, category: 'dairy' },
  'mozzarella': { min: 30, max: 80, category: 'dairy' },
  'feta': { min: 20, max: 50, category: 'dairy' },
  'goat cheese': { min: 20, max: 50, category: 'dairy' },
  'blue cheese': { min: 15, max: 40, category: 'dairy' },
  'ricotta': { min: 60, max: 150, category: 'dairy' },
  'cottage cheese': { min: 60, max: 150, category: 'dairy' },
  'cream cheese': { min: 30, max: 60, category: 'dairy' },
  'butter': { min: 10, max: 30, category: 'dairy' },
  'ghee': { min: 10, max: 30, category: 'dairy' },
  'cream': { min: 30, max: 120, category: 'dairy' },
  'yoghurt': { min: 100, max: 200, category: 'dairy' },
  'yogurt': { min: 100, max: 200, category: 'dairy' },
  'milk': { min: 100, max: 250, category: 'dairy' },
  'almond milk': { min: 100, max: 250, category: 'dairy' },
  'coconut milk': { min: 60, max: 150, category: 'dairy' },

  // CONDIMENTS & OILS
  'mayonnaise': { min: 15, max: 45, category: 'condiment' },
  'mayo': { min: 15, max: 45, category: 'condiment' },
  'olive oil': { min: 10, max: 30, category: 'condiment' },
  'avocado oil': { min: 10, max: 30, category: 'condiment' },
  'coconut oil': { min: 10, max: 30, category: 'condiment' },
  'honey': { min: 5, max: 20, category: 'condiment' },
  'maple syrup': { min: 10, max: 30, category: 'condiment' },
  'mustard': { min: 5, max: 20, category: 'condiment' },
  'vinegar': { min: 10, max: 30, category: 'condiment' },
  'tamari': { min: 10, max: 30, category: 'condiment' },
  'soy sauce': { min: 10, max: 30, category: 'condiment' },
  'salsa': { min: 30, max: 60, category: 'condiment' },
  'guacamole': { min: 30, max: 60, category: 'condiment' },
  'pesto': { min: 15, max: 40, category: 'condiment' },
  'bbq sauce': { min: 15, max: 45, category: 'condiment' },
  'tomato sauce': { min: 30, max: 100, category: 'condiment' },

  // LIQUIDS
  'broth': { min: 60, max: 200, category: 'liquid' },
  'stock': { min: 60, max: 200, category: 'liquid' },
  'water': { min: 0, max: 500, category: 'liquid' },  // Very flexible

  // NUTS & SEEDS
  'almonds': { min: 20, max: 50, category: 'nuts' },
  'walnuts': { min: 15, max: 40, category: 'nuts' },
  'pecans': { min: 15, max: 40, category: 'nuts' },
  'cashews': { min: 20, max: 50, category: 'nuts' },
  'macadamia': { min: 20, max: 50, category: 'nuts' },
  'peanuts': { min: 20, max: 50, category: 'nuts' },
  'chia seeds': { min: 10, max: 30, category: 'nuts' },
  'flaxseed': { min: 10, max: 30, category: 'nuts' },
  'hemp seeds': { min: 15, max: 40, category: 'nuts' },
  'sunflower seeds': { min: 15, max: 40, category: 'nuts' },
  'pumpkin seeds': { min: 15, max: 40, category: 'nuts' },
  'almond butter': { min: 15, max: 40, category: 'nuts' },
  'peanut butter': { min: 15, max: 40, category: 'nuts' },

  // GRAINS & LEGUMES
  'black beans': { min: 60, max: 120, category: 'legumes' },
  'cannellini beans': { min: 60, max: 120, category: 'legumes' },
  'chickpeas': { min: 60, max: 120, category: 'legumes' },
  'lentils': { min: 60, max: 120, category: 'legumes' },
  'quinoa': { min: 40, max: 100, category: 'grains' },
  'rice': { min: 60, max: 150, category: 'grains' },
  'oats': { min: 40, max: 80, category: 'grains' },

  // FRUITS
  'lemon': { min: 15, max: 60, category: 'fruit' },
  'lime': { min: 10, max: 40, category: 'fruit' },
  'orange': { min: 100, max: 200, category: 'fruit' },
  'apple': { min: 100, max: 200, category: 'fruit' },
  'banana': { min: 100, max: 150, category: 'fruit' },
  'blueberries': { min: 50, max: 120, category: 'fruit' },
  'strawberries': { min: 80, max: 150, category: 'fruit' },
  'raspberries': { min: 50, max: 100, category: 'fruit' },

  // BAKING & OTHER
  'almond flour': { min: 20, max: 60, category: 'baking' },
  'coconut flour': { min: 10, max: 30, category: 'baking' },
  'cocoa powder': { min: 5, max: 20, category: 'baking' },
  'collagen': { min: 10, max: 30, category: 'supplement' },
  'protein powder': { min: 20, max: 40, category: 'supplement' },
}

// Match ingredient name to serving range
function findServingRange(ingredientName) {
  const name = ingredientName.toLowerCase()

  // Sort by length descending to match longer/more specific terms first
  const sortedKeys = Object.keys(SERVING_RANGES).sort((a, b) => b.length - a.length)

  for (const key of sortedKeys) {
    if (name.includes(key)) {
      return { key, ...SERVING_RANGES[key] }
    }
  }
  return null
}

// Load all recipe files
function loadRecipes() {
  const recipesDir = path.join(__dirname, '../data/recipes')
  const recipeFiles = fs.readdirSync(recipesDir).filter(f => f.endsWith('.json'))

  let allRecipes = []

  for (const file of recipeFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(recipesDir, file), 'utf8'))
      if (data.recipes && Array.isArray(data.recipes)) {
        allRecipes = allRecipes.concat(data.recipes.map(r => ({ ...r, _sourceFile: file })))
      }
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message)
    }
  }

  return allRecipes
}

// Validate all recipes
function validateRecipes() {
  const recipes = loadRecipes()
  const issues = []
  const fixes = []

  for (const recipe of recipes) {
    const baseServings = recipe.base_servings || 1

    if (!recipe.ingredients) continue

    for (const ing of recipe.ingredients) {
      const range = findServingRange(ing.name)
      if (!range) continue  // No validation rule for this ingredient

      const perServe = ing.grams / baseServings

      // Determine severity
      let severity = null
      if (perServe > range.max * 2) {
        severity = 'CRITICAL'
      } else if (perServe > range.max * 1.5) {
        severity = 'HIGH'
      } else if (perServe > range.max) {
        severity = 'MEDIUM'
      } else if (perServe < range.min * 0.5) {
        severity = 'LOW'  // Unusually small
      }

      if (severity) {
        const suggestedGrams = Math.round(((range.min + range.max) / 2) * baseServings)

        issues.push({
          recipe: recipe.name,
          recipeId: recipe.id,
          sourceFile: recipe._sourceFile,
          ingredient: ing.name,
          ingredientId: ing.id,
          baseServings,
          totalGrams: ing.grams,
          perServeGrams: Math.round(perServe * 10) / 10,
          expectedRange: `${range.min}-${range.max}g`,
          matchedRule: range.key,
          category: range.category,
          severity,
          suggestedTotal: suggestedGrams,
          suggestedPerServe: Math.round(suggestedGrams / baseServings)
        })

        if (severity === 'CRITICAL' || severity === 'HIGH') {
          fixes.push({
            file: recipe._sourceFile,
            recipeId: recipe.id,
            recipeName: recipe.name,
            ingredientId: ing.id,
            ingredientName: ing.name,
            currentGrams: ing.grams,
            suggestedGrams,
            reason: `${Math.round(perServe)}g per serve exceeds ${range.max}g max (${severity})`
          })
        }
      }
    }
  }

  return { issues, fixes, totalRecipes: recipes.length }
}

// Format table output
function formatTable(issues) {
  const criticalAndHigh = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')
  const medium = issues.filter(i => i.severity === 'MEDIUM')

  console.log('\n' + '='.repeat(120))
  console.log('RECIPE INGREDIENT VALIDATION REPORT')
  console.log('='.repeat(120))

  console.log(`\nTotal issues found: ${issues.length}`)
  console.log(`  🔴 CRITICAL: ${issues.filter(i => i.severity === 'CRITICAL').length}`)
  console.log(`  🟠 HIGH: ${issues.filter(i => i.severity === 'HIGH').length}`)
  console.log(`  🟡 MEDIUM: ${issues.filter(i => i.severity === 'MEDIUM').length}`)
  console.log(`  🔵 LOW: ${issues.filter(i => i.severity === 'LOW').length}`)

  if (criticalAndHigh.length > 0) {
    console.log('\n' + '-'.repeat(120))
    console.log('🔴🟠 CRITICAL & HIGH PRIORITY ISSUES')
    console.log('-'.repeat(120))
    console.log('')
    console.log(
      'Recipe'.padEnd(45) +
      'Ingredient'.padEnd(30) +
      'Per Serve'.padEnd(12) +
      'Expected'.padEnd(15) +
      'Severity'.padEnd(10)
    )
    console.log('-'.repeat(120))

    for (const issue of criticalAndHigh) {
      const emoji = issue.severity === 'CRITICAL' ? '🔴' : '🟠'
      console.log(
        `${emoji} ${issue.recipe.substring(0, 42)}`.padEnd(45) +
        issue.ingredient.substring(0, 28).padEnd(30) +
        `${issue.perServeGrams}g`.padEnd(12) +
        issue.expectedRange.padEnd(15) +
        issue.severity.padEnd(10)
      )
    }
  }

  if (medium.length > 0) {
    console.log('\n' + '-'.repeat(120))
    console.log('🟡 MEDIUM PRIORITY ISSUES (may be intentional)')
    console.log('-'.repeat(120))
    console.log('')
    console.log(
      'Recipe'.padEnd(45) +
      'Ingredient'.padEnd(30) +
      'Per Serve'.padEnd(12) +
      'Expected'.padEnd(15)
    )
    console.log('-'.repeat(120))

    for (const issue of medium.slice(0, 20)) {  // Limit to first 20
      console.log(
        `🟡 ${issue.recipe.substring(0, 42)}`.padEnd(45) +
        issue.ingredient.substring(0, 28).padEnd(30) +
        `${issue.perServeGrams}g`.padEnd(12) +
        issue.expectedRange.padEnd(15)
      )
    }
    if (medium.length > 20) {
      console.log(`   ... and ${medium.length - 20} more`)
    }
  }

  console.log('\n' + '='.repeat(120))
}

// Main
const { issues, fixes, totalRecipes } = validateRecipes()

console.log(`\nScanned ${totalRecipes} recipes...`)

formatTable(issues)

// Save fixes JSON
if (fixes.length > 0) {
  const fixesPath = path.join(__dirname, 'suggested-ingredient-fixes.json')
  fs.writeFileSync(fixesPath, JSON.stringify(fixes, null, 2))
  console.log(`\n📝 Suggested fixes saved to: ${fixesPath}`)
  console.log(`   Review and apply with: node scripts/apply-ingredient-fixes.js`)
}

// Save full report
const reportPath = path.join(__dirname, 'ingredient-validation-report.json')
fs.writeFileSync(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalRecipes,
  summary: {
    critical: issues.filter(i => i.severity === 'CRITICAL').length,
    high: issues.filter(i => i.severity === 'HIGH').length,
    medium: issues.filter(i => i.severity === 'MEDIUM').length,
    low: issues.filter(i => i.severity === 'LOW').length
  },
  issues,
  suggestedFixes: fixes
}, null, 2))

console.log(`📊 Full report saved to: ${reportPath}`)
console.log('')
