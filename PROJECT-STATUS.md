# Adaptive Meal Builder - Project Status

**Last Updated:** 5 December 2025, 3:00 PM AEDT
**Ship Date:** 10 December 2025

---

## Quick Status

| What | Status |
|------|--------|
| **Current Phase** | Household Model Complete |
| **Next Action** | Run Supabase migration, test household features |
| **Blocker** | None |
| **Schedule** | On track |

---

## Architecture Pivot (Day 4)

**Before:** AI generates recipes on-demand via Claude API
- Slow (10-50 seconds)
- Error-prone (JSON parsing failures)
- No quality control
- Snacks = Meals (wrong)

**After:** Pre-made recipe library with smart selection
- Instant (database query)
- Guaranteed quality (Ian-curated)
- Proper meal type tagging
- Phase-aware, batch-aware, preference-aware

---

## What's Built

| Component | Status |
|-----------|--------|
| Next.js project | ✅ Complete |
| Supabase connection | ✅ Complete |
| Vercel deployment | ✅ Complete |
| 171 ingredients database | ✅ Complete |
| Ingredient browser with search/filter | ✅ Complete |
| Project specification | ✅ Complete |
| Database schema (7 tables) | ✅ Complete |
| User profiles (Ian + Rhonda) | ✅ Complete |
| UserContext (React state) | ✅ Complete |
| Nutrition calculations (BMR/TDEE) | ✅ Complete |
| Claude API integration | ✅ Complete (kept for future use) |
| Sidebar component (new nav) | ✅ Complete |
| WeekView component | ✅ Complete (needs recipe library) |
| **Recipe Schema** | ✅ Complete |
| **US→AU Mappings** | ✅ Complete |
| **Sample Recipes (8)** | ✅ Complete |
| **Full Recipe Extraction** | ✅ Complete (90 recipes) |
| **Smart Planner API** | ✅ Complete (AI-powered selection) |
| **Smart Planner Library** | ✅ Complete (generateSmartDay/Week) |
| **Household Model** | ✅ Complete (multi-person support) |
| **Settings Page** | ✅ Complete (household management) |
| Recipes page UI | 🔜 Next |
| Shopping list generation | ✅ Complete (household aggregation) |

---

## New File Structure

```
adaptive-meal-builder/
├── data/
│   ├── ingredients.json              ← 171 Galveston ingredients
│   ├── schemas/
│   │   └── RECIPE-SCHEMA.md          ← Full recipe structure
│   ├── mappings/
│   │   ├── us-to-au-ingredients.json ← Ingredient name mapping
│   │   └── imperial-to-metric.json   ← Unit conversions
│   ├── recipes-reference/            ← Sample recipes for reference
│   │   ├── snacks-sample.json        ← 5 sample snacks
│   │   └── mains-sample.json         ← 3 sample mains
│   └── recipes/                      ← Full recipe library (90 recipes)
│       ├── lunch-mains.json          ← 13 lunch recipes
│       ├── dinner-mains.json         ← 18 dinner recipes
│       ├── breakfast.json            ← 9 breakfast recipes
│       ├── smoothies.json            ← 8 smoothie recipes
│       ├── snacks-afternoon.json     ← 22 afternoon snacks
│       └── snacks-evening.json       ← 20 evening snacks
├── docs/
│   ├── galveston-guide/
│   │   └── galveston-diet-book.md    ← Full book content
│   ├── PROJECT-SPEC.md
│   ├── LEARNING-REFERENCE.md
│   └── COMPONENT-STRUCTURE.md
└── src/
    └── ... (app code)
```

---

## Revised Build Phases

1. ✅ **Foundation** (Days 1-2) - Project setup, ingredients, deployment
2. ✅ **Core Infrastructure** (Day 3) - Schema, users, API, UI components
3. ✅ **Recipe Architecture** (Day 4) - Schema design, mappings, samples
4. ✅ **Recipe Library** (Day 5 AM) - Full extraction from book (90 recipes)
5. ✅ **Smart Planner API** (Day 5 AM) - AI-powered meal selection
6. ✅ **Household Model** (Day 5 PM) - Multi-person meal planning
7. 🔜 **Recipes UI** (Day 6) - Browse, filter, favourites
8. ⏳ **Polish & Ship** (Day 7-10) - Testing, fixes, deploy

---

## User Profiles

| User | Calories | Phase 1 Macros |
|------|----------|----------------|
| Ian | 2,300/day | 115g P / 179g F / 58g C |
| Rhonda | 1,850/day | 93g P / 144g F / 46g C |

---

## Live URL

**Production:** https://adaptive-meal-builder.vercel.app

---

## How to Resume

```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
npm run dev
```

Open: http://localhost:3000

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT-SPEC.md` | Complete specification |
| `docs/LEARNING-REFERENCE.md` | Concepts, commands, daily progress |
| `data/schemas/RECIPE-SCHEMA.md` | Recipe structure definition |
| `PROJECT-STATUS.md` | This file - quick status |

---

## Smart Planner API (Day 5)

**New files created:**
- `src/app/api/generate-smart-meals/route.js` - AI endpoint
- `src/lib/smartPlanner.js` - Client library

**Features:**
- Claude Sonnet for cost efficiency (<$0.05/week)
- Phase-aware macro targeting (Phase 1/2/3)
- Dietary restriction filtering (dairy-free, gluten-free, etc.)
- Protein variety rotation (no consecutive repeats)
- Batch-friendly and lunchbox-friendly preferences
- Sends minimal recipe data (ID + name + macros) to reduce tokens

**API endpoint:** `POST /api/generate-smart-meals`
```json
{
  "recipes": [...],
  "phase": "phase1",
  "dailyCalories": 2300,
  "dailyProtein": 115,
  "dailyFat": 179,
  "dailyCarbs": 58,
  "daysToGenerate": 7,
  "dietary": { "dairyFree": false },
  "preferences": { "batchFriendly": true }
}
```

**Library functions:**
- `generateSmartDay(user, targets, preferences, excludeIds)`
- `generateSmartWeek(user, targets, preferences)`
- `calculateDayTotals(dayMeals)`
- `checkMacroCompliance(totals, targets)`

---

## Household Model (Day 5 PM)

**Problem Solved:** Ian and Rhonda share meals but have different calorie needs.

**Solution:**
- **households** table: Groups members who share meal plans
- **household_members** table: Individual profiles with nutrition targets
- Portion calculations per member based on their daily calorie needs
- Shopping list aggregates all members' portions

**New/Updated Files:**
- `supabase/schema.sql` - Added households, household_members tables, migration function
- `src/context/HouseholdContext.js` - Member management, portion calculations
- `src/context/UserContext.js` - Integrated household support
- `src/lib/smartPlanner.js` - Added `generateSmartWeekForHousehold()`, `calculateMemberPortion()`
- `src/lib/shoppingList.js` - Updated to accept member array for aggregation
- `src/components/WeekView.jsx` - Member selector, household-aware totals
- `src/components/SettingsView.jsx` - Household management UI

**How Portions Work:**
- Recipe has 450 cal/serve base
- Ian needs 2300 cal/day, lunch = 35% = 805 cal → portion = 805/450 = 1.79x
- Rhonda needs 1850 cal/day, lunch = 35% = 648 cal → portion = 648/450 = 1.44x
- Shopping multiplier = 1.79 + 1.44 = 3.23 servings to buy

**Migration Steps:**
1. Run new schema in Supabase SQL Editor
2. Create household for existing user via Settings page
3. Add Rhonda as household member

**Meal Distribution (intermittent fasting 16:8):**
- Lunch: 35% of daily calories
- Afternoon Snack: 10%
- Dinner: 45%
- Evening Snack: 10%

---

*Last updated: 5 December 2025, 3:00 PM AEDT - Day 5 Household Model Complete*
