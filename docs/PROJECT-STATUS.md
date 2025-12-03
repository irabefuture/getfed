# Adaptive Meal Builder - Project Status

**Last Updated:** Wednesday 3 December 2025, 7:00 PM AEDT
**Ship Date:** Tuesday 10 December 2025
**Days Remaining:** 7 days

---

## Current Phase: 2.2 - UI & Meal Generation (IN PROGRESS)

### Completed Phases

#### Phase 1: Project Setup ✅
- Next.js 15 with App Router
- Tailwind CSS v4
- Supabase client configured
- Basic project structure

#### Phase 2.1: Database & Core Logic ✅
- 7 database tables created in Supabase
- 171 approved ingredients loaded
- User profiles (Ian + Rhonda) with body stats
- UserContext for state management
- Nutrition calculation library (BMR/TDEE/macros)
- Calculations verified within 1% accuracy

#### Phase 2.2: UI & Meal Generation (IN PROGRESS)
**Completed:**
- ✅ Claude API integration working
- ✅ /api/generate-meals route functional
- ✅ shadcn/ui installed and configured
- ✅ Sage green theme implemented
- ✅ Sidebar component (user selector, macro display, navigation)
- ✅ MealCard component (expandable ingredients/steps)
- ✅ MealPlanner component (generation form, meal grid)
- ✅ Meals generating with accurate macros

**Remaining:**
- [ ] Week view / calendar for assigning meals to days
- [ ] Save plan to database
- [ ] Shopping list generation
- [ ] Meal editing/regeneration

---

## What's Working Right Now

1. **User Switching** - Click user in sidebar, targets update immediately
2. **Meal Generation** - Enter constraints → Claude generates 2-7 meals from approved ingredients
3. **Macro Display** - Each meal shows calories, protein, fat, carbs per serve
4. **Ingredient/Step Expansion** - Click to see full recipe details
5. **Add to Plan** - Select meals, see summary at bottom

---

## Tomorrow's Plan (Day 4 - Thursday 4 Dec)

### Priority 1: Week Planner View
- Calendar/grid showing Mon-Sun
- Drag meals from generated list to day slots
- OR simple dropdown to assign meal to day
- Visual of week's meal plan

### Priority 2: Save Plan to Database
- Save selected meals with day assignments
- Load existing plan for current week
- Clear/reset plan option

### Priority 3: Shopping List
- Aggregate ingredients from week's meals
- Combine duplicates (e.g., all olive oil usage)
- Convert to practical units
- Subtract pantry staples

---

## Technical Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI Framework | shadcn/ui | Industry standard 2025, own the code |
| State Management | React Context | Simple, sufficient for 2 users |
| Meal Generation | Claude API | Uses culinary knowledge, not DB lookup |
| Color Theme | Sage green (oklch) | Anti-inflammatory/health aesthetic |
| Layout | Left sidebar | Dashboard pattern, always-visible context |

---

## Costs Incurred

- **Claude API:** ~$0.08 so far (4 generations × $0.02 each)
- **Supabase:** Free tier
- **Vercel:** Free tier (not deployed yet)

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Macro accuracy | Medium | Defer validation to post-MVP |
| Scope creep | Low | Spec locked, features prioritised |
| Time pressure | Low | 7 days for 3-4 features, manageable |

---

## Files Created Today (Session 4)

### New Files:
- `src/components/Sidebar.jsx` - Left navigation with user/macros
- `src/components/MealCard.jsx` - Individual meal display
- `src/components/MealPlanner.jsx` - Generation form and grid
- `src/components/ui/` - 6 shadcn components (button, card, input, select, dropdown-menu, avatar)
- `src/lib/utils.js` - cn() utility for classnames
- `components.json` - shadcn configuration

### Modified Files:
- `src/app/page.js` - New sidebar layout
- `src/app/globals.css` - Sage green theme
- `src/context/UserContext.js` - Fixed exports, added targets
- `src/lib/nutrition.js` - Renamed return key

---

## Git Commit Ready

Run this command:
```bash
cd ~/Documents/agent-workspace/adaptive-meal-builder
git add -A
git commit -m "Day 3: shadcn/ui setup, sidebar layout, meal generation UI

- Installed shadcn/ui with New York style
- Created sage green theme using oklch colors  
- Built Sidebar component with user selector and macro display
- Built MealCard with expandable ingredients/steps
- Built MealPlanner with generation form
- Fixed UserContext exports and field name mismatches
- Meals now generate and display correctly with full macros"
```
