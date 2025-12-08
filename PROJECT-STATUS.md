# Adaptive Meal Builder - Project Status

**Last Updated:** 7 December 2025, 3:30 PM AEDT
**Ship Date:** 12 December 2025 (Friday)

---

## Quick Status

| What | Status |
|------|--------|
| **Current Phase** | Core Features Complete - Polish & Testing |
| **Next Action** | Mobile responsiveness check, final polish |
| **Blocker** | None |
| **Schedule** | On track for Friday ship |

---

## Day 7 Summary (7 December 2025)

### Critical Bug Fixed: Ingredient Scaling
**Problem:** Shopping list showed absurd amounts (18 avocados, 31 eggs, 1097g salmon)

**Root Cause:** Recipe ingredients are TOTAL amounts for `base_servings`, but code treated them as per-serve.

**Fix:** Applied consistent formula across 3 locations:
```javascript
scaledGrams = (ingredient.grams / recipe.base_servings) * householdMultiplier
```

**Locations fixed:**
- `src/lib/shoppingList.js` - Shopping list generation
- `src/components/WeekView.jsx` - Ingredient display
- `src/components/WeekView.jsx` - Print recipes function

### AU Terminology Complete
All recipe JSONs updated:
| US Term | AU Term |
|---------|---------|
| Ranch dressing | Whole egg mayonnaise |
| Turkey bacon | Bacon rashers |
| String cheese | Cheese sticks |
| Primal Kitchen BBQ sauce | BBQ sauce |
| Kosher salt | Cooking salt |

### New Features Added
- **Recipe Swap Filter:** Search box + category pills (fish, poultry, eggs, etc.)
- **Print Recipes:** Button on each day to print all recipes with scaled ingredients
- **Debug Logging:** Shopping list shows ingredient source breakdown in console
- **Serving Size Validator:** Script to catch data entry errors

### AU Conversion Helpers Fixed
- Cherry tomatoes → "punnets" (not "medium")
- Avocado size → 170g (AU average)
- Added conversions for: broccoli, cauliflower, zucchini, carrot, etc.

### Data Quality
- Created `scripts/validate-serving-sizes.js` for ongoing validation
- Fixed basil in Grape Tomato Salad: 30g → 10g
- All CRITICAL/HIGH issues resolved

### Validation Passed
Sunday + Monday combined shopping list verified:
- ✅ Avocado: 556g (~4 whole)
- ✅ Hard-boiled eggs: 464g (~10 eggs)
- ✅ Cherry tomatoes: 332g (~2 punnets)
- ✅ Salmon: 484g (~3 fillets)
- ✅ All amounts match meal plan exactly

---

## What's Built

| Component | Status |
|-----------|--------|
| Next.js project | ✅ Complete |
| Supabase connection | ✅ Complete |
| Vercel deployment | ✅ Complete |
| 171 ingredients database | ✅ Complete |
| Recipe library (90 recipes) | ✅ Complete |
| Smart Planner (AI meal selection) | ✅ Complete |
| Household model (Ian + Rhonda) | ✅ Complete |
| WeekView with day selection | ✅ Complete |
| Recipe swap with search/filter | ✅ Complete |
| Print Recipes | ✅ Complete |
| Shopping list generation | ✅ Complete |
| Shopping list with household scaling | ✅ Complete |
| AU terminology | ✅ Complete |
| AU conversion helpers | ✅ Complete |
| Ingredient scaling (base_servings) | ✅ Complete |
| Settings page | ✅ Complete |
| Recipes browser | ✅ Complete |
| Mobile responsiveness | 🔜 To test |
| Final polish | 🔜 Remaining |

---

## User Profiles

| User | Calories | Phase 1 Macros | Portion % |
|------|----------|----------------|-----------|
| Ian | 2,300/day | 115g P / 179g F / 58g C | 55% |
| Rhonda | 1,850/day | 93g P / 144g F / 46g C | 45% |

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

## Key Files

| File | Purpose |
|------|---------|
| `docs/PROJECT-SPEC.md` | Complete specification |
| `docs/LEARNING-REFERENCE.md` | Concepts, commands, daily progress |
| `PROJECT-STATUS.md` | This file - quick status |
| `scripts/validate-serving-sizes.js` | Data quality validator |
| `scripts/serving-size-fixes.json` | Validation results |

---

## Remaining Before Ship (Dec 10)

1. **Mobile responsiveness check** - Test on phone/tablet
2. **Edge case testing** - Empty states, error handling
3. **Performance check** - Load times, API response
4. **Final UI polish** - Spacing, typography, colours
5. **Deploy to production** - Vercel push

---

## Git Log (Day 7)

```
dc9abda Day 7: Fix ingredient scaling, AU terminology, and data validation
5aa3665 Add Print Recipes button for daily meal plan
68c47e3 Add search and category filter to recipe swap panel
17add28 Show all recipe alternatives in swap panel
5552ab4 Fix HIGH priority recipe ingredient amounts
25dc54e Add household ingredient scaling
5b547c7 Fix swap alternatives - only exclude same-day recipes
```

---

*Last updated: 7 December 2025, 3:30 PM AEDT - Day 7 Complete*
