# Recipe Schema v1.0

**Created:** 4 December 2025  
**Purpose:** Define the structure for all recipes in Adaptive Meal Builder

---

## Design Principles

1. **Rich metadata enables smart recommendations** - the more we tag, the better the AI can match to user preferences
2. **Metric from the start** - all measurements in grams, ml, celsius
3. **Source tracking** - know where recipes came from for commercial considerations
4. **Scalable** - base servings of 1, system calculates for 2, 4, etc.
5. **Feedback-ready** - structure supports future thumbs up/down with notes

---

## Full Recipe Schema

```typescript
interface Recipe {
  // === IDENTITY ===
  id: string;                    // Unique identifier, kebab-case: "lamb-kofta-salad"
  name: string;                  // Display name: "Lamb Kofta with Greek Salad"
  description: string;           // Brief appetising description (1-2 sentences)
  
  // === CLASSIFICATION ===
  meal_type: MealType;           // When this is eaten
  phase: Phase[];                // Which Galveston phases (can be multiple)
  category: Category;            // Primary protein/base category
  cuisine: string;               // e.g., "mediterranean", "asian", "australian"
  tags: string[];                // Flexible tags for filtering
  
  // === BATCH & STORAGE (Rhonda's insights) ===
  batch_friendly: boolean;       // Can you cook 2x and eat tomorrow?
  batch_notes?: string;          // e.g., "Protein reheats well, salad must be fresh"
  components?: {
    reheatable: string[];        // Parts that keep/reheat
    fresh_only: string[];        // Parts that must be made fresh
  };
  freezer_friendly: boolean;     // Can be frozen and defrosted
  good_for_lunchbox: boolean;    // Portable, eats well cold/reheated at work
  
  // === TASTE & EXPERIENCE ===
  flavour_profile: Flavour[];    // Primary flavour notes
  texture: Texture[];            // Eating experience
  temperature: Temperature;      // How it's served
  
  // === EFFORT ===
  difficulty: Difficulty;
  active_cooking: boolean;       // Needs attention vs set-and-forget
  prep_time_mins: number;
  cook_time_mins: number;
  total_time_mins: number;       // May differ from prep+cook (e.g., marinating)
  
  // === DIETARY FLAGS ===
  dietary: {
    dairy_free: boolean;
    gluten_free: boolean;
    nut_free: boolean;
    egg_free: boolean;
    vegetarian: boolean;
    vegan: boolean;
  };
  
  // === INGREDIENTS ===
  base_servings: number;         // Recipe written for this many (usually 1)
  ingredients: Ingredient[];
  
  // === INSTRUCTIONS ===
  instructions: string[];        // Step by step, plain language
  
  // === NUTRITION (per serve) ===
  per_serve: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fibre_g?: number;            // Optional, nice to have
  };
  
  // === PROVENANCE ===
  source: Source;                // Where this recipe came from
  source_ref?: string;           // Page number, URL, etc.
  
  // === METADATA ===
  created_at: string;            // ISO date
  updated_at: string;            // ISO date
  version: number;               // For tracking changes
}

// === ENUMS ===

type MealType = 
  | "breakfast"
  | "lunch" 
  | "dinner"
  | "snack_afternoon"    // Light, 15:00ish, energy sustaining
  | "snack_evening";     // 19:30ish, satisfying not heavy

type Phase = 1 | 2 | 3;
// Phase 1: 70% fat, 20% protein, 10% carbs (initial, strictest)
// Phase 2: 60→50% fat, 20% protein, 20→30% carbs (transition)
// Phase 3: 40% fat, 20% protein, 40% carbs (maintenance)

type Category = 
  // === PROTEINS & ANIMAL PRODUCTS ===
  | "fish"               // Salmon, tuna, cod, etc.
  | "shellfish"          // Prawns, crab, mussels, etc.
  | "poultry"            // Chicken, turkey, duck
  | "beef"               // Beef, veal
  | "lamb"               // Lamb, mutton
  | "pork"               // Pork, bacon, ham
  | "eggs"               // Egg-based dishes
  | "dairy"              // Cheese, yoghurt, cream-based
  
  // === PLANT-BASED PROTEINS ===
  | "legumes"            // Beans, lentils, chickpeas
  | "nuts_seeds"         // Nut/seed-based dishes
  | "tofu_tempeh"        // Soy-based proteins
  
  // === CARBOHYDRATES & FIBRE ===
  | "grains"             // Rice, oats, quinoa, bread, pasta
  | "fruit"              // Fruit-based dishes/snacks
  | "starchy_veg"        // Potatoes, sweet potato, corn
  
  // === VEGETABLES ===
  | "vegetables"         // General vegetable-forward dishes
  | "leafy_greens"       // Salads, spinach, kale-based
  | "cruciferous"        // Broccoli, cauliflower, cabbage
  
  // === FATS & OILS ===
  | "fats_oils"          // Avocado, olive oil-forward dishes
  
  // === SWEETS ===
  | "sweets"             // Desserts, honey-based, treats
  
  // === BEVERAGES ===
  | "smoothie"           // Blended drinks
  | "hot_beverage"       // Coffee, tea-based
  | "cold_beverage";     // Juices, infused water
  
  // === COMPOSITE ===
  // Note: "vegetarian" and "vegan" are now in dietary flags,
  // not categories. Category = primary ingredient base.

type Flavour = 
  // === BASIC TASTES ===
  | "sweet"              // Sugars
  | "salty"              // Sodium/salt
  | "sour"               // Acid (covers tangy, zesty)
  | "bitter"             // Alkaloids, greens, coffee
  | "umami"              // Glutamates, savoury depth
  
  // === SENSORY ===
  | "spicy"              // Heat/capsaicin
  | "rich"               // High fat, dense flavour
  | "light"              // Low fat, fresh, clean
  | "mild"               // Low intensity overall
  
  // === AROMA/DESCRIPTOR ===
  | "herby"              // Fresh or dried herbs
  | "smoky"              // Wood smoke
  | "earthy"             // Root vegetables, mushrooms
  | "pungent"            // Strong onion/garlic/horseradish
  
  // === MOUTHFEEL ===
  | "astringent"         // Drying, puckering (tea, wine)
  | "fatty";             // Texture of fat/oil

type Texture = 
  | "crispy"
  | "creamy"
  | "crunchy"
  | "soft"
  | "chewy"
  | "smooth"
  | "chunky";

type Temperature = 
  | "hot"
  | "warm"
  | "room_temp"
  | "cold";

type Difficulty = 
  | "no_cook"            // Assembly only
  | "easy"               // Basic skills, <5 steps
  | "medium"             // Some technique required
  | "complex";           // Multiple components, timing critical

type Source = 
  | "galveston_book"     // From the original book
  | "adapted"            // Modified from book
  | "original"           // Created new
  | "user_submitted";    // Future: user contributions

// === INGREDIENT STRUCTURE ===

interface Ingredient {
  id: string;            // Maps to ingredients.json
  name: string;          // Display name (Australian)
  grams: number;         // Amount in grams (per base_servings)
  notes?: string;        // e.g., "roughly chopped", "room temperature"
  optional?: boolean;    // Can be omitted
}
```

---

## Example: Snack Recipe

```json
{
  "id": "cheese-and-walnuts",
  "name": "Cheese and Walnuts",
  "description": "Simple, satisfying combination of creamy cheese and crunchy walnuts.",
  
  "meal_type": "snack_afternoon",
  "phase": [1, 2, 3],
  "category": "dairy",
  "cuisine": "universal",
  "tags": ["quick", "no-cook", "portable", "high-fat"],
  
  "batch_friendly": false,
  "freezer_friendly": false,
  "good_for_lunchbox": true,
  
  "flavour_profile": ["salty", "mild", "rich"],
  "texture": ["creamy", "crunchy"],
  "temperature": "room_temp",
  
  "difficulty": "no_cook",
  "active_cooking": false,
  "prep_time_mins": 2,
  "cook_time_mins": 0,
  "total_time_mins": 2,
  
  "dietary": {
    "dairy_free": false,
    "gluten_free": true,
    "nut_free": false,
    "egg_free": true,
    "vegetarian": true,
    "vegan": false
  },
  
  "base_servings": 1,
  "ingredients": [
    { "id": "cheese-cheddar", "name": "Cheddar cheese", "grams": 30 },
    { "id": "walnuts", "name": "Walnut halves", "grams": 30 }
  ],
  
  "instructions": [
    "Arrange walnuts on a small plate.",
    "Slice or cube cheese and add to plate.",
    "Serve immediately or pack for later."
  ],
  
  "per_serve": {
    "calories": 280,
    "protein_g": 10,
    "fat_g": 26,
    "carbs_g": 2
  },
  
  "source": "galveston_book",
  "source_ref": "p.209",
  
  "created_at": "2025-12-04",
  "updated_at": "2025-12-04",
  "version": 1
}
```

---

## Example: Main Meal Recipe

```json
{
  "id": "lamb-kofta-greek-salad",
  "name": "Lamb Kofta with Greek Salad",
  "description": "Spiced lamb patties served with a fresh, tangy Greek salad.",
  
  "meal_type": "dinner",
  "phase": [1, 2, 3],
  "category": "lamb",
  "cuisine": "mediterranean",
  "tags": ["high-protein", "fresh", "summer"],
  
  "batch_friendly": false,
  "batch_notes": "Kofta can be made ahead and reheated. Salad must be fresh.",
  "components": {
    "reheatable": ["lamb kofta"],
    "fresh_only": ["greek salad"]
  },
  "freezer_friendly": true,
  "good_for_lunchbox": true,
  
  "flavour_profile": ["umami", "herby", "sour"],
  "texture": ["crispy", "crunchy", "soft"],
  "temperature": "warm",
  
  "difficulty": "medium",
  "active_cooking": true,
  "prep_time_mins": 15,
  "cook_time_mins": 12,
  "total_time_mins": 27,
  
  "dietary": {
    "dairy_free": false,
    "gluten_free": true,
    "nut_free": true,
    "egg_free": true,
    "vegetarian": false,
    "vegan": false
  },
  
  "base_servings": 1,
  "ingredients": [
    { "id": "lamb-mince", "name": "Lamb mince", "grams": 150 },
    { "id": "onion", "name": "Brown onion", "grams": 30, "notes": "finely diced" },
    { "id": "garlic", "name": "Garlic", "grams": 5, "notes": "minced" },
    { "id": "cumin", "name": "Ground cumin", "grams": 2 },
    { "id": "coriander-ground", "name": "Ground coriander", "grams": 1 },
    { "id": "olive-oil", "name": "Olive oil", "grams": 15 },
    { "id": "cucumber", "name": "Lebanese cucumber", "grams": 80, "notes": "diced" },
    { "id": "tomato", "name": "Tomato", "grams": 80, "notes": "diced" },
    { "id": "feta", "name": "Feta cheese", "grams": 30, "notes": "crumbled" },
    { "id": "olives-kalamata", "name": "Kalamata olives", "grams": 20 },
    { "id": "lemon", "name": "Lemon juice", "grams": 15 }
  ],
  
  "instructions": [
    "Combine lamb mince, onion, garlic, cumin, and coriander in a bowl. Season with salt and pepper.",
    "Form mixture into 3-4 small oval patties.",
    "Heat olive oil in a frypan over medium-high heat.",
    "Cook kofta for 3-4 minutes each side until browned and cooked through.",
    "While kofta cooks, combine cucumber, tomato, feta, and olives in a bowl.",
    "Dress salad with lemon juice and a drizzle of olive oil.",
    "Serve kofta alongside or on top of salad."
  ],
  
  "per_serve": {
    "calories": 520,
    "protein_g": 35,
    "fat_g": 38,
    "carbs_g": 10
  },
  
  "source": "original",
  
  "created_at": "2025-12-04",
  "updated_at": "2025-12-04",
  "version": 1
}
```

---

## Filtering Capabilities This Enables

With this schema, the planner can filter by:

| Filter | Example Query |
|--------|---------------|
| Meal type | "Show me afternoon snacks" |
| Phase | "Only Phase 1 compliant" |
| Protein preference | "User loves fish, avoid beef" |
| Batch cooking | "I want to cook once, eat twice" |
| Lunchbox friendly | "Needs to travel to work" |
| Flavour | "User prefers tangy over spicy" |
| Time available | "Under 20 mins total" |
| Difficulty | "No-cook options only" |
| Dietary | "Must be dairy-free" |
| Served temperature | "Cold meals for hot day" |

---

## User Preference Matching

When user says during onboarding:
- "I love lamb" → Prioritise `category: "lamb"`
- "I hate spicy" → Exclude `flavour_profile` containing "spicy"
- "I batch cook on Sundays" → Prioritise `batch_friendly: true`
- "I take lunch to work" → Prioritise `good_for_lunchbox: true`
- "Keep it simple" → Filter `difficulty: "no_cook" | "easy"`

---

## Future: Feedback Schema

```typescript
interface RecipeFeedback {
  recipe_id: string;
  user_id: string;
  rating: "up" | "down";
  date: string;
  notes?: string;           // "Too fiddly for weeknight"
  would_make_again: boolean;
  tags?: string[];          // ["too-salty", "great-leftovers"]
}
```

This feeds back into recommendations: "You rated lamb kofta 👎 with note 'too fiddly' - avoiding complex lamb dishes"

---

## Next Steps

1. You review this schema - anything missing or wrong?
2. I create the ingredient mapping file (US → AU)
3. I extract 5 snacks + 3 mains from the book using this schema
4. You review those samples
5. We iterate or scale up

**Does this schema capture everything you've described?**
