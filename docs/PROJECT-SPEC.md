# Adaptive Meal Builder - Project Specification

**Version:** 3.0 (Day 4 Revision)  
**Date:** 4 December 2025  
**Ship Date:** 10 December 2025

---

## Project Purpose

A web application for weekly meal planning following the Galveston Diet, with:
- AI-generated meal suggestions using anti-inflammatory ingredients
- **Fixed week structure** (Mon-Sun) with This Week / Next Week views
- Calculated nutrition targets from body stats (not manual entry)
- Two-user support (Ian + Rhonda) - each sees their own calendar
- Shopping list generation from confirmed weekly plan
- Australian ingredients and metric measurements

**Primary use case:** Open on weekend, generate next week's meals, produce shopping list, know what to cook each day.

---

## Key UX Decisions (Day 4)

| Decision | Choice | Reason |
|----------|--------|--------|
| Week structure | Fixed Mon-Sun | Matches real planning rhythm |
| Week tabs | This Week + Next Week | Plan ahead on weekends |
| User model | Single user logged in | Each person has their own view |
| Serving size | Choose at generation (1, 2, 4) | Couples often cook together |
| +1 button | Quick double for partner joining | "Join me for dinner" scenario |
| Meals per day | 4 (Lunch, Afternoon Snack, Dinner, Evening Snack) | 16:8 fasting window 12:00-20:00 |
| Shopping list | Separate view, checkboxes | Mark "have it" vs "need to buy" |
| Archive | Automatic (week passes, becomes history) | No manual rollover needed |

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
| Preferences | Vegetarian-leaning, prefers plant-based |
| **Calculated calories** | **1,850/day** |
| **Phase 1 macros** | **93g P / 144g F / 46g C** |

---

## App Structure

### Sidebar Navigation
```
┌─────────────────────┐
│  [User: Ian ▼]      │  ← Switch user
│                     │
│  📅 This Week       │  ← Mon-Sun current week
│  📅 Next Week       │  ← Mon-Sun following week
│                     │
│  🛒 Shopping List   │  ← Generated from week plan
│                     │
│  ⚙️ Settings        │  ← Profile, preferences
└─────────────────────┘
```

### Week View (Main Screen)
```
┌─────────────────────────────────────────────────────────────┐
│  This Week: Dec 2-8                    [Generate Week ▼]    │
│                                        Servings: [2 ▼]      │
├─────────────────────────────────────────────────────────────┤
│  Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun                   │
│  ✓   │ ✓   │ ✓   │ ●   │     │     │                       │
│              (● = today, ✓ = has meals, empty = no plan)    │
├─────────────────────────────────────────────────────────────┤
│  THURSDAY 5 DECEMBER                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🥗 LUNCH                                    [+1] [✓] │  │
│  │ Mediterranean Salmon Bowl                            │  │
│  │ 485 cal • 42g P • 28g F • 12g C                     │  │
│  │ [View Recipe ▼]                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🍎 AFTERNOON SNACK                          [+1] [✓] │  │
│  │ Celery with Almond Butter                            │  │
│  │ 180 cal • 6g P • 14g F • 8g C                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ... Dinner, Evening Snack ...                              │
│                                                             │
│  Day Total: 2,180 / 2,300 cal                              │
│  ████████████████████░░░ 95%                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure
See: `/docs/COMPONENT-STRUCTURE.md`

---

## Core User Flows

### Flow 1: Generate Weekly Plan
1. User selects "This Week" or "Next Week"
2. Clicks "Generate Week" button
3. Chooses serving size (1, 2, or 4)
4. AI generates 28 meals (7 days × 4 meals)
5. Progress shown: "Generating meals... Generating snacks..."
6. Meals appear in day cards
7. User can expand recipe, mark as done, or +1 for partner

### Flow 2: View and Execute Daily Plan
1. Open app → This Week is default
2. Today is highlighted in day strip
3. Click today to see 4 meal cards
4. Expand recipe to see ingredients and instructions
5. Mark meal as done when eaten
6. Day totals show macro progress

### Flow 3: Shopping List
1. Navigate to Shopping List in sidebar
2. See all ingredients aggregated from week plan
3. Grouped by category (Produce, Protein, Pantry)
4. Check items you already have
5. Unchecked items = shopping list
6. Print or send to Apple Reminders (stretch goal)

### Flow 4: +1 Partner Joining
1. Partner says "I'll join you for dinner"
2. Click +1 on that meal card
3. Servings double (affects shopping list)
4. Macros stay as per-serve reference

---

## Database Schema

### Tables Required (MVP)

**users**
```sql
id uuid PRIMARY KEY,
name text NOT NULL,
gender text, -- 'male', 'female'
date_of_birth date,
height_cm float8,
current_weight_kg float8,
target_weight_kg float8,
activity_level text, -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
goal text, -- 'lose', 'maintain', 'gain'
current_phase text, -- 'phase1', 'phase2', 'phase3'
eating_window_start time,
eating_window_end time,
created_at timestamp DEFAULT now(),
updated_at timestamp DEFAULT now()
```

**planned_meals**
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES users(id),
date date NOT NULL,
meal_slot text NOT NULL, -- 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'
name text NOT NULL,
servings int DEFAULT 1, -- can be increased with +1
prep_time_mins int,
cook_time_mins int,
instructions text,
ingredients_json jsonb, -- [{ingredient_id, quantity_g, name}]
calories int, -- per serve
protein_g float8,
fat_g float8,
carbs_g float8,
completed boolean DEFAULT false,
created_at timestamp DEFAULT now()
```

**preferences** (future)
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES users(id),
ingredient_id text REFERENCES ingredients(id),
rating text -- 'love', 'like', 'dislike', 'never'
```

**ingredients** (existing - 171 rows)
```sql
id text PRIMARY KEY,
name text,
category text,
protein_per_100g float8,
fat_per_100g float8,
carbs_per_100g float8,
calories_per_100g int
```

---

## AI Integration

### Generation Flow
1. User clicks "Generate Week"
2. API call to `/api/generate-meals`
3. Prompt includes:
   - Full ingredient list (171 approved foods)
   - User's calculated macro targets
   - Serving size requested
   - User's preferences (when implemented)
   - Recent meal history (to avoid repetition)
4. Claude returns structured JSON
5. Meals inserted into `planned_meals` table

### Prompt Structure
```
Generate 28 meals for a week following the Galveston Diet Phase 1.

User targets: 2,300 cal/day, 115g P, 179g F, 58g C
Serving size: 2 people
Meal slots: Lunch, Afternoon Snack, Dinner, Evening Snack

RULES:
- ONLY use ingredients from the provided list
- Each meal must include macros per serve
- Vary proteins (don't repeat within 4 days)
- Include prep/cook times
- Australian metric measurements

INGREDIENTS:
[list of 171 ingredients with macros]

Return JSON array of meals...
```

### Generation Timing
- Full week (28 meals): ~30-60 seconds
- Strategy: Generate meals (14) first, then snacks (14)
- Show progress: "Generating meals..." → "Generating snacks..."

---

## MVP Scope (Ship Dec 10)

### Must Have ✅
- [ ] Sidebar with user picker and navigation
- [ ] This Week view (Mon-Sun)
- [ ] Day strip navigation (click day to see meals)
- [ ] Generate Week button with serving selector
- [ ] MealCard component (name, macros, expand recipe)
- [ ] Mark meal as complete
- [ ] Day totals (macros progress)
- [ ] Shopping list view (basic - grouped, checkboxes)
- [ ] Save meals to Supabase
- [ ] Load meals from Supabase

### Stretch (If Time)
- [ ] Next Week tab
- [ ] +1 button on individual meal
- [ ] Send shopping list to Apple Reminders
- [ ] Generation progress indicator

### Phase 2 (After Ship)
- [ ] Recipe URL import ("Add Recipes" tab)
- [ ] Auto-archive week rollover
- [ ] Weight tracking / progress visualization
- [ ] Thumbs up/down ratings
- [ ] User preferences (love/like/dislike ingredients)
- [ ] My Day cooking mode (recipe stays open)
- [ ] Notification when generation complete

---

## Galveston Diet Reference

### Phases
| Phase | Fat | Protein | Carbs | When |
|-------|-----|---------|-------|------|
| Phase 1 | 70% | 20% | 10% | First 4-6 weeks or reset |
| Phase 2 | 50% | 20% | 30% | Gradual carb reintroduction |
| Phase 3 | 40% | 20% | 40% | Long-term sustainable |

### Three Pillars
1. **16:8 intermittent fasting** (8-hour eating window)
2. **Anti-inflammatory foods** (berries, leafy greens, fatty fish, nuts, olive oil, avocado)
3. **Macro tracking** with net carbs

### Meal Structure (16:8 window 12:00-20:00)
- 12:00 - Lunch
- 15:00 - Afternoon Snack
- 18:00 - Dinner
- 19:30 - Evening Snack

---

## Calculated Nutrition Targets

Targets calculated from body stats, auto-update when weight changes.

**BMR (Mifflin-St Jeor):**
- Women: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
- Men: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5

**TDEE:** BMR × activity multiplier (Moderate = 1.55)

**Goal adjustment:**
- Lose: TDEE - 500
- Maintain: TDEE
- Gain: TDEE + 300

**Macros:** From phase ratios applied to daily calories

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (future) |
| AI | Claude API (Anthropic) |
| Hosting | Vercel |
| State | React Context |

---

## File Structure

```
adaptive-meal-builder/
├── src/
│   ├── app/
│   │   ├── page.js              # Home → WeekView
│   │   ├── layout.js            # App shell with sidebar
│   │   ├── shopping/page.js     # Shopping list view
│   │   └── api/
│   │       └── generate-meals/route.js
│   ├── components/
│   │   ├── Sidebar.jsx          # Navigation
│   │   ├── UserSelector.js      # User picker
│   │   ├── WeekView.jsx         # Main week display
│   │   ├── DayStrip.jsx         # Mon-Sun tabs
│   │   ├── MealCard.jsx         # Individual meal
│   │   ├── GenerateButton.jsx   # Generate controls
│   │   ├── DayTotals.jsx        # Macro progress
│   │   └── ShoppingListView.jsx # Shopping list
│   ├── context/
│   │   └── UserContext.js       # Selected user state
│   ├── lib/
│   │   ├── supabase.js          # Database client
│   │   └── nutrition.js         # Calculation functions
│   └── styles/
│       └── globals.css
├── docs/
│   ├── PROJECT-SPEC.md          # This file
│   ├── PROJECT-STATUS.md        # Current progress
│   ├── COMPONENT-STRUCTURE.md   # Component breakdown
│   └── LEARNING-REFERENCE.md    # Session notes
└── package.json
```

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| Days 1-3: Foundation | ✅ Complete | 171 ingredients, React components, Supabase |
| Day 4 Session 1: Scope | ✅ Complete | Revised to week-based structure |
| Day 4 Session 2: Build | 🔜 Next | Create new components |
| Days 5-7: Core Features | ⏳ Pending | Week view, generation, shopping |
| Days 8-9: Polish | ⏳ Pending | Styling, edge cases |
| Day 10: Ship | ⏳ Pending | Deploy and test |

---

*Last updated: 4 December 2025 - Day 4 Session 1*
