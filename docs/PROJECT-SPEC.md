# Adaptive Meal Builder - Project Specification

**Version:** 2.0 (Major Revision)  
**Date:** 3 December 2025  
**Ship Date:** 10 December 2025

---

## Project Purpose

A web application for weekly meal planning following the Galveston Diet, with:
- AI-generated meal suggestions using anti-inflammatory ingredients
- Multi-day planning with shopping list generation
- Calculated nutrition targets from body stats (not manual entry)
- Two-user support (Ian + Rhonda) with individual portion logging
- Australian ingredients and metric measurements

**Why this matters:** Replaces daily ad-hoc recipe requests to Claude with a structured system that plans ahead and generates shopping lists.

---

## User Profiles

### Ian
| Field | Value |
|-------|-------|
| DOB | 20 Sep 1968 |
| Gender | Male |
| Height | 182 cm |
| Current weight | 94.8 kg |
| Target weight | 88 kg |
| Activity level | Moderate |
| Goal | Lose |
| Current phase | Phase 1 |
| Eating window | 12:00 - 20:00 |
| **Calculated calories** | **2,300/day** |
| **Phase 1 macros** | **115g P / 179g F / 58g C** |

### Rhonda
| Field | Value |
|-------|-------|
| DOB | 30 May 1974 |
| Gender | Female |
| Height | 175 cm |
| Current weight | 84.5 kg |
| Target weight | 80 kg |
| Activity level | Moderate |
| Goal | Lose |
| Current phase | Phase 1 |
| Eating window | 12:00 - 20:00 |
| **Calculated calories** | **1,850/day** |
| **Phase 1 macros** | **93g P / 144g F / 46g C** |

---

## Galveston Diet Phases

| Phase | Fat | Protein | Carbs | When |
|-------|-----|---------|-------|------|
| Phase 1 (Fat-Burning) | 70% | 20% | 10% | First 4-6 weeks or reset |
| Phase 2 (Transition) | 50% | 20% | 30% | Gradual carb reintroduction |
| Phase 3 (Maintenance) | 40% | 20% | 40% | Long-term sustainable |

**Three pillars (constant):**
1. 16:8 intermittent fasting (8-hour eating window)
2. Anti-inflammatory foods (berries, leafy greens, fatty fish, nuts, olive oil, avocado)
3. Macro tracking with net carbs

---

## Calculated Nutrition Targets

Targets are **calculated, not stored** - automatically update when weight changes.

### Formulas

**BMR (Basal Metabolic Rate) - Mifflin-St Jeor:**
- Women: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
- Men: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5

**TDEE (Total Daily Energy Expenditure):** BMR × activity multiplier
- Sedentary: 1.2
- Lightly Active: 1.375
- Moderately Active: 1.55
- Active: 1.725
- Very Active: 1.9

**Goal adjustment:**
- Lose weight: TDEE - 500
- Maintain: TDEE
- Gain: TDEE + 300

**Macros from phase ratios:**
- Fat: calories × phase_fat_% ÷ 9
- Protein: calories × phase_protein_% ÷ 4
- Carbs: calories × phase_carbs_% ÷ 4

---

## Database Schema

### Existing Table (Expand)

**ingredients** (171 rows → expand to 500+ later)
```
id (text, PK)
name (text)
category (text)
protein_per_100g (float8)
fat_per_100g (float8)
carbs_per_100g (float8)
calories_per_100g (int4)
-- ADD:
shopping_unit (text) - 'g', 'piece', 'head', 'bunch', 'fillet'
shopping_unit_grams (float8) - conversion factor
```

### New Tables

**users**
```
id (uuid, PK)
name (text)
gender (text) - 'male', 'female'
date_of_birth (date)
height_cm (float8)
current_weight_kg (float8)
target_weight_kg (float8)
activity_level (text) - 'sedentary', 'light', 'moderate', 'active', 'very_active'
goal (text) - 'lose', 'maintain', 'gain'
current_phase (text) - 'phase1', 'phase2', 'phase3'
eating_window_start (time)
eating_window_end (time)
created_at (timestamp)
updated_at (timestamp)
```
*Note: Calorie/macro targets are CALCULATED, not stored*

**preferences**
```
id (uuid, PK)
user_id (uuid, FK → users)
ingredient_id (text, FK → ingredients)
rating (text) - 'love', 'like', 'dislike', 'never'
```

**pantry_staples**
```
id (uuid, PK)
ingredient_id (text, FK → ingredients)
-- Items to hide from shopping list (olive oil, garlic, salt, etc.)
```

**planned_meals**
```
id (uuid, PK)
date (date)
meal_type (text) - 'breakfast', 'lunch', 'dinner', 'snack'
name (text)
cooking_serves (int) - how many portions cooked (1, 2, 4)
prep_time_mins (int)
cook_time_mins (int)
instructions (text)
ingredients_json (jsonb) - [{ingredient_id, quantity_g, name}]
protein_g (float8) - per serve
fat_g (float8) - per serve
carbs_g (float8) - per serve
calories (int) - per serve
status (text) - 'planned', 'cooked', 'skipped', 'rescheduled'
source (text) - 'ai_generated', 'recipe_book', 'user_created'
created_at (timestamp)
```

**meal_logs**
```
id (uuid, PK)
user_id (uuid, FK → users)
planned_meal_id (uuid, FK → planned_meals, nullable)
date (date)
meal_type (text)
name (text)
servings (float8) - 0.5, 1, 1.5, 2 (person's portion)
protein_g (float8) - actual total for this person
fat_g (float8)
carbs_g (float8)
calories (int)
rating (text) - 'thumbs_up', 'thumbs_down', null
rating_reason (text, nullable)
off_plan (boolean) - true if not from planned_meals
off_plan_estimate (text) - 'high_carb', 'high_fat', 'balanced', null
created_at (timestamp)
```

**saved_meals** (templates for quick-add)
```
id (uuid, PK)
user_id (uuid, FK → users)
name (text) - "Ian's smoothie"
meal_type (text)
ingredients_json (jsonb)
protein_g (float8)
fat_g (float8)
carbs_g (float8)
calories (int)
is_default (boolean) - show at top of quick-add
created_at (timestamp)
```

**recipes** (curated proven meals - LATER PHASE)
```
id (uuid, PK)
name (text)
description (text)
meal_type (text)
serves (int)
prep_time_mins (int)
cook_time_mins (int)
instructions (text)
ingredients_json (jsonb)
phase_suitable (text[]) - ['phase1', 'phase2', 'phase3']
tested (boolean)
rating_average (float8)
created_at (timestamp)
```

---

## Core User Flows

### Flow 1: Plan Meals
1. Select days to plan (Mon-Thu dinners)
2. Select meal types and cooking quantity (serves 2)
3. OPTIONAL: Guide AI with constraints ("use the lamb", "quick meals only", "no fish this week")
4. AI generates plan with metadata (prep time, cook time, macros per serve)
5. Review suggestions, swap any meals that don't suit
6. Confirm → saved to planned_meals

### Flow 2: Shopping List
1. View aggregated ingredients from all planned meals
2. Quantities combined (Mon 150g + Wed 150g = 300g salmon)
3. Converted to practical units ("2 fillets" not "300g")
4. Pantry staples hidden (configurable)
5. Checklist UI to mark items while shopping

### Flow 3: Daily Cooking
1. Open app, see today's planned meal(s)
2. Tap "Start Cooking" → cooking mode (large text, step-by-step, screen stays on)
3. Finish cooking → Quick log (as planned, 1 tap) OR Detailed log (edit portions/ingredients)
4. Each person logs their own portion (Rhonda: 1 serve, Ian: 1.5 serves)

### Flow 4: Flexibility (Life Happens)
- Reschedule meal to different day (drag or menu)
- Skip meal (remove from plan)
- Ate off-plan → quick estimate entry (rough category: high_carb, high_fat, balanced)
- App doesn't break when plans change

### Flow 5: Reactive Mode (No Plan)
- No meals planned, need suggestion now
- Optionally guide: "something quick", "use the chicken"
- AI suggests single meal
- Cook or request alternative

---

## AI Integration

### Prompt Context (sent to Claude API)
- Full ingredient list with macros (171 approved foods)
- User's current phase and calculated macro targets
- Preferences (love/like/dislike/never for each ingredient)
- Last 14 days of meal logs (for variety awareness)
- User's pre-generation constraints
- Number of meals to generate

### AI Returns
```json
{
  "meals": [
    {
      "name": "Herb-Crusted Salmon with Roasted Vegetables",
      "meal_type": "dinner",
      "serves": 2,
      "prep_time_mins": 15,
      "cook_time_mins": 25,
      "ingredients": [
        {"ingredient_id": "salmon", "quantity_g": 300, "name": "Salmon fillet"},
        {"ingredient_id": "broccoli", "quantity_g": 200, "name": "Broccoli"}
      ],
      "instructions": "1. Preheat oven to 200°C...",
      "per_serve": {
        "protein_g": 42,
        "fat_g": 28,
        "carbs_g": 12,
        "calories": 468
      }
    }
  ]
}
```

### Variety Logic
- Don't repeat same protein within 4 days
- Don't suggest disliked ingredients
- Favour loved ingredients
- Flag if something hasn't been eaten in 2+ weeks

### Constraint Types
- Use ingredient: "Use the lamb mince in the fridge"
- Exclude ingredient: "No fish this week"
- Time constraint: "Quick meals only (under 30 min total)"
- Equipment: "Include a slow cooker meal"
- Cuisine: "Something Asian-inspired"

### Preventing Hallucination
- Ingredient list explicitly provided in prompt
- Instruction: "ONLY use ingredients from this list"
- Future: Validate AI response against allowed ingredient IDs

---

## Build Phases

### Phase 1: Foundation
- [ ] Create all database tables in Supabase
- [ ] Insert Ian + Rhonda user profiles
- [ ] User selector component (who's using the app)
- [ ] Display calculated targets for selected user
- [ ] Verify calculations match expected values

### Phase 2: Meal Planning
- [ ] Claude API route (`/api/generate-meals`)
- [ ] Plan generation UI (select days, meals, serves)
- [ ] Pre-generation constraint input
- [ ] Display AI suggestions with metadata
- [ ] Swap/regenerate individual meals
- [ ] Confirm and save plan to database

### Phase 3: Shopping List
- [ ] Aggregate ingredients from date range
- [ ] Combine quantities for same ingredient
- [ ] Convert to shopping units where configured
- [ ] Filter out pantry staples
- [ ] Checklist UI with tap-to-check

### Phase 4: Daily Execution
- [ ] Today's meal view
- [ ] Cooking mode (large text, step-by-step)
- [ ] Quick log (as planned)
- [ ] Detailed log (edit ingredients/portions)
- [ ] Individual portion logging per person

### Phase 5: Flexibility
- [ ] Reschedule meal to different day
- [ ] Skip meal
- [ ] Off-plan quick entry with estimate
- [ ] Reactive single-meal suggestion

### Phase 6: Learning
- [ ] Thumbs up/down rating after cooking
- [ ] Optional reason capture
- [ ] Include ratings in AI prompt context
- [ ] Recency/variety awareness in AI logic

### Phase 7: Preferences & Settings
- [ ] Mark ingredients love/like/dislike/never
- [ ] Configure pantry staples list
- [ ] Edit profile (weight, phase, eating window)
- [ ] Reset to Phase 1 option

### Phase 8: Expansion (Future)
- [ ] Recipe database (proven meals)
- [ ] Expanded ingredients (500+)
- [ ] Week macro overview chart
- [ ] Progress tracking over time

---

## Success Criteria (MVP)

App is "done enough" when you can:
1. ✅ Plan Mon-Thu dinners with AI
2. ✅ Guide AI with constraints before generating
3. ✅ Review plan, swap meals that don't suit
4. ✅ Generate shopping list (minus pantry staples)
5. ✅ See today's planned meal with recipe
6. ✅ Log meal as cooked (quick or detailed)
7. ✅ Each person logs their own portion
8. ✅ Skip or reschedule when plans change
9. ✅ Rate meals thumbs up/down
10. ✅ AI uses ratings and history for future suggestions

---

## What We Keep From Current Build

- ✅ Next.js project structure
- ✅ Supabase connection
- ✅ Vercel deployment
- ✅ 171 ingredients database
- ✅ Ingredient browser UI (becomes secondary feature)
- ✅ Tailwind CSS styling
- ⏸️ Manual meal builder (paused, may become "build custom meal" later)

---

## Key Decisions Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Pantry staples | Yes - configurable list | Hide items always in stock from shopping |
| Shared vs separate logging | Separate entries per person | Even same meal, different portions |
| Recipe ratings | Thumbs up/down | Simple, optional reason only if useful |
| Pre-generation constraints | Full support | User will use often to guide AI |
| Calorie entry | Calculate from body stats | Proper nutrition app, auto-adjusts |
| Macro approach | Galveston phases for both | Simplicity, eating together |

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| 1.1 Ingredients Database | ✅ Complete | 171 foods loaded |
| 1.2 React Fundamentals | ✅ Complete | Components, props, state |
| 1.3 Search & Filter | ✅ Complete | Working ingredient browser |
| 2.0 Project Spec | ✅ Complete | This document |
| 2.1 Database Schema | 🔜 Next | Create all tables |
| 2.2 User Profiles | ⏳ Pending | Insert Ian + Rhonda |

---

*Last updated: 3 December 2025*
