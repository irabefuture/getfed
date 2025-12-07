/**
 * Recipe Ingredient Validator
 * Scans all recipes and flags unrealistic gram amounts
 * 
 * Run with: node scripts/validate-recipes.js
 */

const fs = require('fs')
const path = require('path')

// Load all recipe JSON files
const recipesDir = path.join(__dirname, '../data/recipes')
const recipeFiles = [
  'lunch-mains.json',
  'dinner-mains.json',
  'snacks-afternoon.json',
  'snacks-evening.json',
  'smoothies.json',
  'breakfast.json'
]

let recipes = []
for (const file of recipeFiles) {
  const filePath = path.join(recipesDir, file)
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      if (data.recipes && Array.isArray(data.recipes)) {
        recipes = recipes.concat(data.recipes)
      }
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e.message)
    }
  }
}

if (recipes.length === 0) {
  console.error('No recipes found in data/recipes/')
  process.exit(1)
}

// Reasonable gram ranges for common ingredients (per single serve)
const ingredientRanges = {
  // Proteins
  'salmon': { min: 100, max: 250, typical: 150 },
  'chicken': { min: 100, max: 300, typical: 150 },
  'beef': { min: 100, max: 300, typical: 150 },
  'turkey': { min: 80, max: 200, typical: 120 },
  'bacon': { min: 20, max: 60, typical: 30 },
  'egg': { min: 50, max: 150, typical: 100 },
  'tofu': { min: 100, max: 200, typical: 150 },
  'tempeh': { min: 80, max: 150, typical: 100 },
  'mozzarella': { min: 30, max: 100, typical: 60 },
  'cheese': { min: 20, max: 80, typical: 40 },
  
  // Vegetables
  'avocado': { min: 50, max: 200, typical: 100 },
  'tomato': { min: 50, max: 200, typical: 100 },
  'lettuce': { min: 30, max: 150, typical: 60 },
  'spinach': { min: 30, max: 100, typical: 50 },
  'zucchini': { min: 80, max: 200, typical: 120 },
  'squash': { min: 80, max: 200, typical: 120 },
  'broccoli': { min: 80, max: 200, typical: 100 },
  'cucumber': { min: 50, max: 150, typical: 80 },
  'carrot': { min: 50, max: 150, typical: 80 },
  'onion': { min: 20, max: 80, typical: 40 },
  'garlic': { min: 3, max: 20, typical: 10 },
  
  // Fruits
  'lemon': { min: 30, max: 80, typical: 50 },
  'raspberry': { min: 30, max: 100, typical: 60 },
  'blueberry': { min: 30, max: 100, typical: 60 },
  
  // Fats
  'butter': { min: 10, max: 50, typical: 20 },
  'olive oil': { min: 10, max: 45, typical: 20 },
  'mayonnaise': { min: 15, max: 45, typical: 30 },
  'coconut milk': { min: 100, max: 250, typical: 160 },
  'almond butter': { min: 15, max: 40, typical: 25 },
  
  // Other
  'chia': { min: 10, max: 40, typical: 25 },
  'honey': { min: 10, max: 30, typical: 20 },
  'ranch': { min: 20, max: 60, typical: 40 },
}

// Check if ingredient name matches any key
function findIngredientType(name) {
  const lowerName = name.toLowerCase()
  for (const [key, range] of Object.entries(ingredientRanges)) {
    if (lowerName.includes(key)) {
      return { key, range }
    }
  }
  return null
}

// Validation results
const issues = []

console.log('Scanning', recipes.length, 'recipes...\n')

recipes.forEach(recipe => {
  const recipeIssues = []
  
  recipe.ingredients?.forEach(ing => {
    const match = findIngredientType(ing.name)
    if (match) {
      const { key, range } = match
      
      // Flag if more than 3x the max (clearly wrong)
      if (ing.grams > range.max * 3) {
        recipeIssues.push({
          ingredient: ing.name,
          current: ing.grams,
          expected: `${range.min}-${range.max}g`,
          typical: range.typical,
          severity: ing.grams > range.max * 10 ? 'CRITICAL' : 'HIGH',
          suggestedFix: range.typical
        })
      }
      // Flag if more than 2x max (probably wrong)
      else if (ing.grams > range.max * 2) {
        recipeIssues.push({
          ingredient: ing.name,
          current: ing.grams,
          expected: `${range.min}-${range.max}g`,
          typical: range.typical,
          severity: 'MEDIUM',
          suggestedFix: range.typical
        })
      }
    }
    
    // Also flag any single ingredient over 500g (suspicious for a single serve)
    if (ing.grams > 500 && !recipeIssues.find(i => i.ingredient === ing.name)) {
      recipeIssues.push({
        ingredient: ing.name,
        current: ing.grams,
        expected: '<500g per serve',
        severity: ing.grams > 1000 ? 'CRITICAL' : 'HIGH',
        suggestedFix: Math.round(ing.grams / 10) // Likely off by 10x
      })
    }
  })
  
  if (recipeIssues.length > 0) {
    issues.push({
      id: recipe.id,
      name: recipe.name,
      meal_type: recipe.meal_type,
      issues: recipeIssues
    })
  }
})

// Output results
console.log('=' .repeat(80))
console.log('RECIPE VALIDATION REPORT')
console.log('=' .repeat(80))
console.log()

if (issues.length === 0) {
  console.log('✅ No issues found!')
} else {
  // Group by severity
  const critical = issues.filter(r => r.issues.some(i => i.severity === 'CRITICAL'))
  const high = issues.filter(r => !r.issues.some(i => i.severity === 'CRITICAL') && r.issues.some(i => i.severity === 'HIGH'))
  const medium = issues.filter(r => r.issues.every(i => i.severity === 'MEDIUM'))
  
  console.log(`Found issues in ${issues.length} recipes:\n`)
  console.log(`  🔴 CRITICAL: ${critical.length} recipes`)
  console.log(`  🟠 HIGH: ${high.length} recipes`)
  console.log(`  🟡 MEDIUM: ${medium.length} recipes`)
  console.log()
  
  // Show critical first
  if (critical.length > 0) {
    console.log('─'.repeat(80))
    console.log('🔴 CRITICAL ISSUES (likely off by 10x or more)')
    console.log('─'.repeat(80))
    critical.forEach(recipe => {
      console.log(`\n📍 ${recipe.name} (${recipe.id})`)
      console.log(`   Type: ${recipe.meal_type}`)
      recipe.issues.forEach(issue => {
        if (issue.severity === 'CRITICAL') {
          console.log(`   ❌ ${issue.ingredient}: ${issue.current}g → suggest ${issue.suggestedFix}g`)
        }
      })
    })
  }
  
  if (high.length > 0) {
    console.log('\n' + '─'.repeat(80))
    console.log('🟠 HIGH PRIORITY ISSUES')
    console.log('─'.repeat(80))
    high.forEach(recipe => {
      console.log(`\n📍 ${recipe.name} (${recipe.id})`)
      console.log(`   Type: ${recipe.meal_type}`)
      recipe.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue.ingredient}: ${issue.current}g (expected ${issue.expected})`)
      })
    })
  }
  
  if (medium.length > 0) {
    console.log('\n' + '─'.repeat(80))
    console.log('🟡 MEDIUM PRIORITY ISSUES')
    console.log('─'.repeat(80))
    medium.forEach(recipe => {
      console.log(`\n📍 ${recipe.name} (${recipe.id})`)
      recipe.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue.ingredient}: ${issue.current}g (expected ${issue.expected})`)
      })
    })
  }
}

console.log('\n' + '='.repeat(80))
console.log('END OF REPORT')
console.log('='.repeat(80))

// Also output JSON for programmatic use
const outputPath = path.join(__dirname, 'recipe-validation-report.json')
fs.writeFileSync(outputPath, JSON.stringify(issues, null, 2))
console.log(`\nJSON report saved to: ${outputPath}`)
