# Adaptive Meal Builder - Project Status

**Last Updated:** 8 December 2025, 5:30 PM AEDT
**Ship Date:** 12 December 2025 (Friday)

---

## Quick Status

| What | Status |
|------|--------|
| **Current Phase** | Mobile UX Complete - PWA Testing Next |
| **Next Action** | PWA view testing, final polish |
| **Blocker** | None |
| **Schedule** | On track for Friday ship |

---

## Day 8 Summary (8 December 2025) - Mobile UX Overhaul

### Session Summary
- Completed mobile responsiveness testing
- Implemented compact meal cards (all 4 visible on screen)
- New layout: Header with AI icon + Print | Day strip | Date | 4 meals | Bottom nav
- Auto-plan flow with Generate modal (Generate Day / Fill Empty Days / Cancel)
- Recipe overlay with double-tap open/close
- Swipe left on meal cards for Swap/Delete actions
- Day strip moved to top, horizontally scrollable
- Fixed ingredient scaling and AU terminology
- Button labels updated (Plan AI → Generate, Commit → Add to List)
- Moved "Add to List" to Shopping tab (pending implementation)
- Bottom nav restored (removed experimental hide/pull-up)
- Multiple batch fixes for typography, spacing, gestures

### Mobile Layout (Final)
```
┌─────────────────────────────────┐
│ ✨  Meal Planner  🖨️           │  ← Green header, AI left, Print right
├─────────────────────────────────┤
│ [Sun][Mon][Tue][Wed][Thu]...    │  ← Day strip, horizontally scrollable
├─────────────────────────────────┤
│ Sunday 8 December               │  ← Date header
├─────────────────────────────────┤
│ 🥗 LUNCH · 12:00 · 15m          │
│ Mediterranean Salmon Bowl       │  ← Compact card (double-tap = recipe)
│ Fresh salmon with quinoa...     │  ← Single line description
├─────────────────────────────────┤
│ 🍎 AFTERNOON SNACK · 15:00      │
│ Greek Yogurt Parfait            │
│ Creamy yogurt with berries...   │
├─────────────────────────────────┤
│ 🍽️ DINNER · 18:00 · 25m         │
│ Herb-Crusted Chicken            │
│ Tender chicken with herbs...    │
├─────────────────────────────────┤
│ 🫐 EVENING SNACK · 19:30        │
│ Cheese & Cucumber Bites         │
│ Light and refreshing...         │
├─────────────────────────────────┤
│ Planner | Recipes | Shop | Fam  │  ← Bottom nav (always visible)
└─────────────────────────────────┘
```

### Gestures
- **Double-tap meal card** → Opens full-screen recipe overlay
- **Double-tap recipe overlay** → Closes it
- **Swipe left on meal card** → Reveals Swap/Delete buttons
- **Tap X in recipe header** → Also closes overlay

### Key Technical Changes
1. **Fixed layout** - `h-screen overflow-hidden` with flexbox
2. **Day strip at top** - Part of fixed header section
3. **Cards share vertical space** - `flex-1 min-h-0` for equal distribution
4. **Recipe overlay z-200** - True full-screen modal over everything
5. **Wake lock** - Screen stays on during cooking mode

### Current State
- Core mobile UX working
- Testing in PWA (Add to Home Screen) view pending
- Will refine spacing/sizing based on PWA full-screen testing

---

## Day 7 Summary (7 December 2025)

### Critical Bug Fixed: Ingredient Scaling
**Problem:** Shopping list showed absurd amounts (18 avocados, 31 eggs, 1097g salmon)

**Root Cause:** Recipe ingredients are TOTAL amounts for `base_servings`, but code treated them as per-serve.

**Fix:** Applied consistent formula across 3 locations:
```javascript
scaledGrams = (ingredient.grams / recipe.base_servings) * householdMultiplier
```

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
| Mobile compact layout | ✅ Complete |
| Double-tap recipe overlay | ✅ Complete |
| Swipe-to-reveal actions | ✅ Complete |
| Generate modal (Day/Fill Empty) | ✅ Complete |
| PWA testing | 🔜 To test |
| Final polish | 🔜 Remaining |

---

## Remaining Before Ship (Friday 12 Dec)

1. **PWA view testing** - Add to Home Screen on iPhone
2. **Spacing/sizing adjustments** - Based on PWA full-screen testing
3. **Shopping tab "Add from meal plan"** - Move commit action to Shopping tab
4. **Edge case testing** - Empty states, error handling
5. **Rhonda user testing** - Real-world feedback
6. **Final polish** - Any remaining UI refinements
7. **Deploy to production** - Vercel push

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
| `src/components/WeekView.jsx` | Main planner component |
| `src/components/RecipeOverlay.jsx` | Full-screen recipe modal |
| `src/components/Sidebar.jsx` | Navigation components |

---

## Git Log (Day 8)

```
bfe4790 Day 8: Mobile UX overhaul - compact layout, auto-plan flow, recipe overlay, navigation improvements
```

---

*Last updated: 8 December 2025, 5:30 PM AEDT - Day 8 Complete*
