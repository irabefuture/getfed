# Recipe Extraction Task for Claude Code

**Created:** 5 December 2025
**Purpose:** Extract all recipes from Galveston Diet book into structured JSON

---

## Task Overview

Extract all ~75 recipes from `docs/galveston-guide/galveston-diet-book.md` into JSON files following the schema in `data/schemas/RECIPE-SCHEMA.md`.

## Source Files to Read First

1. `data/schemas/RECIPE-SCHEMA.md` - The schema definition
2. `data/recipes-reference/snacks-sample.json` - 5 example snacks (format reference)
3. `data/recipes-reference/mains-sample.json` - 3 example mains (format reference)
4. `data/mappings/us-to-au-ingredients.json` - US→AU ingredient name conversions
5. `data/mappings/imperial-to-metric.json` - Unit conversions
6. `docs/galveston-guide/galveston-diet-book.md` - The source book (Chapter 9 has recipes)

## Output Files to Create

Create these files in `data/recipes/`:

```
data/recipes/
├── lunch-mains.json      # Lunch-appropriate main meals
├── dinner-mains.json     # Dinner-appropriate main meals  
├── snacks-afternoon.json # Afternoon snacks (lighter, energy-sustaining)
├── snacks-evening.json   # Evening snacks (satisfying, not heavy)
├── smoothies.json        # All smoothie recipes
└── breakfast.json        # Breakfast recipes (lower priority, users do 16:8 fasting)
```

## Conversion Requirements

### Imperial to Metric
- 1 cup = 240ml (liquids) or use weight for solids
- 1 tablespoon = 15ml or 15g
- 1 teaspoon = 5ml or 5g
- 1 oz = 28g
- Fahrenheit to Celsius: (F - 32) × 5/9

### US to AU Ingredients
Use mappings file. Key ones:
- cilantro → coriander
- bell pepper → capsicum
- shrimp → prawns
- ground beef → beef mince
- heavy cream → thickened cream
- broil → grill

### Meal Type Classification
- Recipes with eggs, pancakes, parfaits → breakfast (but also could be lunch)
- Salads, wraps, lighter proteins → lunch
- Heartier proteins, more substantial → dinner
- Small portions, quick assembly → snacks
- Smoothies stay as smoothies

### Phase Assignment
- Most recipes work for all phases [1, 2, 3]
- Higher carb recipes (with grains, more fruit) → [2, 3] or [3] only
- Strict keto-style → [1, 2, 3]

## Schema Fields to Populate

Every recipe needs ALL these fields (see RECIPE-SCHEMA.md for types):

```
id, name, description
meal_type, phase, category, cuisine, tags
batch_friendly, batch_notes, components, freezer_friendly, good_for_lunchbox
flavour_profile, texture, temperature
difficulty, active_cooking, prep_time_mins, cook_time_mins, total_time_mins
dietary (all 6 boolean flags)
base_servings, ingredients (with id, name, grams, notes, optional)
instructions (array of strings)
per_serve (calories, protein_g, fat_g, carbs_g, fibre_g)
source, source_ref
created_at, updated_at, version
```

## Nutrition Calculation

The book doesn't always provide macros. Estimate based on ingredients:
- Protein: ~4 cal/g
- Carbs: ~4 cal/g  
- Fat: ~9 cal/g

Use rough estimates - we'll refine later. Better to have approximate values than none.

## Quality Checklist

For each recipe:
- [ ] All measurements in metric (grams, ml, celsius)
- [ ] All ingredients use Australian names
- [ ] Cooking terms use Australian terms (grill not broil)
- [ ] meal_type assigned correctly
- [ ] phase array assigned (most are [1,2,3])
- [ ] All dietary flags checked (dairy_free, gluten_free, etc.)
- [ ] batch_friendly considered (can you make extra and eat tomorrow?)
- [ ] good_for_lunchbox considered (travels well?)
- [ ] Nutrition estimated

## Start Command

```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
# Then begin extraction
```

## Notes

- This is for personal use only (not commercial distribution)
- Source all recipes as `"source": "galveston_book"`
- Include page reference where visible: `"source_ref": "p.XXX"`
- If a recipe could work for multiple meal types, pick the most likely primary use
- Smoothies can work as snacks - categorise as smoothies but can be tagged for snack use

---

**When complete:** Update PROJECT-STATUS.md to show recipe extraction complete.
