# MVP Audit - GetFed Fitness Pivot

**Date:** 29 December 2025
**Auditor:** @tech-developer
**Codebase Version:** Current main branch

---

## Executive Summary

- **Solid foundation:** Well-architected React/Next.js app with clean component structure
- **Working AI integration:** Claude API meal generation is cost-optimised and functional
- **Household mode is a differentiator:** Individual portion calculations for shared meals
- **Major pivot work required:** 7 files contain Galveston-specific logic needing generalisation
- **Missing fundamentals:** No authentication, no payment, no dynamic onboarding
- **Estimated refactor:** 5-7 days to generalise, 10-15 days for complete fitness pivot

---

## What Works Well

| Component | Why It Works | Keep As-Is? |
|-----------|--------------|-------------|
| `WeekView.jsx` | Core planner with swipe gestures, multi-day selection, AI generation | Keep core, update meal slots |
| `ShoppingListView.jsx` | Ingredient aggregation, meal breakdown, copy/print functionality | Yes |
| `Sidebar.jsx` | Responsive design, macro tracking display, navigation | Yes |
| `OnboardingModal.jsx` | Clean 4-step flow with visual highlights | Expand for goal selection |
| `smartPlanner.js` | Household portions, AI orchestration, variety tracking | Generalise macro calculations |
| `mealPlanService.js` | Supabase CRUD, recipe_json storage, exclusion handling | Yes |
| `shoppingList.js` | Smart aggregation, category organisation, stale detection | Yes |
| `RecipeOverlay.jsx` | Recipe detail view, print recipes | Yes |
| Supabase integration | Clean persistence layer with localStorage fallback | Yes |
| PWA manifest | App-like experience ready | Yes |

**Key Strengths:**
1. **Cost-optimised AI:** Sends minimal recipe data to Claude (~IDs, names, macros, flags)
2. **Household mode:** Unique differentiator - individual portions for shared meals
3. **Recipe swap:** Alternatives filtered by same-day duplicates, category filters
4. **Shopping list intelligence:** Detects stale lists, shows ingredient sources
5. **Print functionality:** Both recipes and shopping lists with clean layouts

---

## What Needs Fixing

| Issue | Severity | File Location | Fix Estimate |
|-------|----------|---------------|--------------|
| No user authentication | High | App-wide | 2-3 days |
| Hardcoded household fetch (first in table) | High | `UserContext.js:48-57`, `HouseholdContext.js:127-132` | 1 day |
| DiscoverView is placeholder | Medium | `DiscoverView.jsx` | 2-3 days for MVP |
| No payment integration | High | Not implemented | 2-3 days (Stripe/Lemon) |
| 1-second polling for sidebar updates | Low | `Sidebar.jsx:82-87` | 0.5 day (use events) |
| No error boundary around AI calls | Medium | `WeekView.jsx` | 0.5 day |
| Console.log statements in production code | Low | Multiple files | 0.5 day |

**No critical bugs found.** Code quality is solid.

---

## Galveston-Specific Code to Generalise

| Item | File Location | Change Required |
|------|---------------|-----------------|
| **Phase 1/2/3 macro ratios** | `HouseholdContext.js:19-23`, `nutrition.js:23-28`, `generate-smart-meals/route.js:22-26` | Replace with configurable diet templates |
| **Phase-based recipe filtering** | `generate-smart-meals/route.js:33-35` | Filter by user's selected diet instead |
| **"Galveston Diet" in AI prompts** | `generate-smart-meals/route.js:149` | Parameterise diet methodology name |
| **Phase ratios in sidebar** | `Sidebar.jsx:229-230` | Show selected diet name instead |
| **Phase info in SettingsView** | `SettingsView.jsx:11-15`, `510-520` | Replace with diet template selection |
| **16:8 fasting window (no breakfast)** | `WeekView.jsx:48-53` | Add breakfast slot, make meal slots configurable |
| **Phase filtering in smartPlanner** | `smartPlanner.js:36-40` | Use diet template instead of phase |

### Current MEAL_SLOTS (hardcoded for 16:8 fasting):
```javascript
// WeekView.jsx:48-53
const MEAL_SLOTS = [
  { id: 'lunch', label: 'Lunch', icon: '🥗', time: '12:00' },
  { id: 'snack_afternoon', label: 'Afternoon Snack', icon: '🍎', time: '15:00' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', time: '18:00' },
  { id: 'snack_evening', label: 'Evening Snack', icon: '🫐', time: '19:30' },
]
```

### Current Phase Ratios (hardcoded for Galveston):
```javascript
// HouseholdContext.js:19-23
const PHASE_RATIOS = {
  1: { fat: 0.70, protein: 0.20, carbs: 0.10 },  // Keto-style
  2: { fat: 0.55, protein: 0.20, carbs: 0.25 },  // Transition
  3: { fat: 0.40, protein: 0.20, carbs: 0.40 },  // Maintenance
}
```

---

## Recommended Removals

| Component | Reason | Effort to Remove |
|-----------|--------|------------------|
| `MealPlanner.jsx` | Appears unused (replaced by WeekView) | 10 min |
| `MealGeneratorTest.js` | Test file in components | 10 min |
| `/api/generate-meals/route.js` | Older AI endpoint, replaced by generate-smart-meals | 30 min |
| Console.log statements | Debug code in production | 30 min |
| `RecipesView.jsx` | May be unused (check routes) | 30 min |

---

## Missing for Fitness Market

| Feature | Priority | Effort Estimate | Notes |
|---------|----------|-----------------|-------|
| **Dynamic onboarding** | P0 | 2-3 days | Goal selection (cut/bulk/maintain), stats input, diet preference |
| **Breakfast meal slot** | P0 | 0.5 day | Add slot, update MEAL_DISTRIBUTION |
| **Diet templates system** | P0 | 2-3 days | Replace phase system with flexible templates |
| **User authentication** | P0 | 2-3 days | Supabase Auth (already set up) |
| **Payment integration** | P1 | 2-3 days | Stripe/LemonSqueezy |
| **Recipe database expansion** | P1 | 3-5 days | High-protein breakfast, pre/post workout |
| **Progress tracking** | P2 | 3-4 days | Weight, measurements, photos |
| **Workout integration** | P3 | 5+ days | Sync with fitness trackers |

### Diet Templates Needed for Fitness:

```javascript
// Proposed structure
const DIET_TEMPLATES = {
  high_protein_cut: {
    name: 'High Protein (Cutting)',
    macros: { protein: 0.40, carbs: 0.30, fat: 0.30 },
    calorieAdjust: -500,
    mealSlots: ['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner'],
  },
  high_protein_bulk: {
    name: 'High Protein (Bulking)',
    macros: { protein: 0.30, carbs: 0.45, fat: 0.25 },
    calorieAdjust: +300,
    mealSlots: ['breakfast', 'snack_am', 'lunch', 'snack_pm', 'dinner', 'snack_evening'],
  },
  balanced_maintenance: {
    name: 'Balanced (Maintenance)',
    macros: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    calorieAdjust: 0,
    mealSlots: ['breakfast', 'lunch', 'dinner', 'snack'],
  },
  // Keep Galveston for backward compatibility
  galveston_phase1: { ... },
}
```

---

## AI Usage Analysis

### Current Usage

| Feature | API Calls | Est. Cost/User/Week |
|---------|-----------|---------------------|
| Week generation | 1 call (generate-smart-meals) | ~$0.03-0.05 |
| Day generation | 1 call | ~$0.01 |
| Recipe swap | 0 (client-side filtering) | $0 |
| Shopping list | 0 (client-side calculation) | $0 |

**Total estimated cost:** ~$0.05/user/week (very efficient)

### Where AI is Used:
1. `src/app/api/generate-smart-meals/route.js` (main endpoint)
   - Model: `claude-sonnet-4-20250514`
   - Token usage: ~1000 input, ~2000 output
   - Cost tracking: Built-in usage reporting

2. `src/app/api/generate-meals/route.js` (legacy, likely unused)

### Recommended Changes

**Keep:**
- AI-powered week generation (core differentiator)
- Cost-optimised prompt with minimal recipe data

**Add:**
- AI recipe suggestion in Discover view
- AI-powered macro checking for user-added recipes
- (Optional) AI meal timing optimization based on workout schedule

**Consider Removing:**
- `/api/generate-meals/route.js` if confirmed unused

---

## Technical Debt

1. **Polling in Sidebar** (`Sidebar.jsx:82-87`): Uses setInterval to poll localStorage every 1 second. Should use custom events instead.

2. **Dual Context Providers**: Both `UserContext.js` and `HouseholdContext.js` exist with overlapping functionality. Could be consolidated.

3. **Recipe Data Location**: Recipes are in static JSON files (`/data/recipes/*.json`). For fitness pivot, need strategy for expanding database - either larger JSON or move to Supabase.

4. **No Proper Routing**: App uses single-page view switching, not Next.js routing. Works fine for MVP but limits deep linking.

---

## Refactoring Estimate

| Phase | Work | Time |
|-------|------|------|
| **Generalise from Galveston** | Replace phase system with diet templates, add breakfast slot, parameterise AI prompts, update UI copy | 5-7 days |
| **Add authentication** | Supabase Auth integration, protected routes, login flow | 2-3 days |
| **Expand onboarding** | Goal selection, body stats input, diet preference, TDEE calculation | 2-3 days |
| **Expand recipe database** | Add breakfast recipes, high-protein options, categorise for goals | 3-5 days |
| **Add payment** | Stripe/LemonSqueezy integration, trial flow, subscription management | 2-3 days |
| **Polish & testing** | Mobile testing, edge cases, error handling | 2-3 days |
| **Total** | | **16-24 days** |

---

## Files Summary

**Total source files (excluding node_modules):** ~50
**Recipe JSON lines:** 6,687
**Key components:** 20
**API routes:** 2
**Lib files:** 10

### File Categories

| Category | Files | Notes |
|----------|-------|-------|
| Components | 20 | WeekView largest (~1000 lines) |
| Context | 2 | UserContext, HouseholdContext |
| Lib | 10 | Planner, recipes, shopping list, etc. |
| API Routes | 2 | generate-meals, generate-smart-meals |
| Data (recipes) | 6 | ~90 recipes total |
| Config | 5 | package.json, tailwind, eslint, etc. |

---

## Recommendations

### Quick Wins (Before Full Pivot)
1. Remove unused components (MealPlanner.jsx, MealGeneratorTest.js)
2. Replace console.log with proper logging or remove
3. Fix sidebar polling to use events

### For Fitness Pivot
1. Start with diet templates system - this is foundational
2. Add breakfast slot before expanding recipes
3. Implement auth before payment (users need accounts)
4. Expand recipe database in parallel with code changes
5. Keep Galveston as one template option (backward compatibility)

### Don't Break
- Household mode (differentiator)
- Shopping list functionality
- AI generation (core feature)
- Recipe swap UX

---

*Audit complete. Ready for @market-researcher to add competitive analysis.*
