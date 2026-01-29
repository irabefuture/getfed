# GetFed Fitness Pivot - Research Brief

**Date:** 29 December 2025  
**Purpose:** Comprehensive analysis before pivoting GetFed from Galveston Diet couples app → Fitness/Gym market  
**Deliverable Location:** `/docs/research/fitness-pivot/`

---

## Context

GetFed is a working MVP meal planning app built in 10 days (Dec 2025). Current state:
- Hardcoded for 2 users (Ian/Rhonda) following Galveston Diet
- 90 recipes focused on Phase 1/2/3 Galveston (high fat, moderate protein, low carb)
- Intermittent fasting model (no breakfast - eating window 12pm-8pm)
- Household mode with different portion calculations per person
- AI meal generation via Claude API
- Shopping list generation
- Australian ingredients and terminology

**Proposed pivot:** Gym/fitness market (gym bros, gym girls, athletes, sports people)

---

## Research Tasks

### TASK 1: Nutritional Database Analysis
**Assignee:** @tech-developer  
**Output:** `/docs/research/fitness-pivot/01-nutritional-databases.md`

**Questions to answer:**

1. **Australian nutritional databases**
   - What is FSANZ NUTTAB? How to access/integrate?
   - What is AUSNUT? Differences from NUTTAB?
   - Are these free for commercial use? Licensing?
   - API availability or bulk download only?
   - What nutrients are included? (macros, micros, vitamins, minerals)

2. **USA nutritional databases**
   - USDA FoodData Central - API details, rate limits, commercial use terms
   - Nutritionix API - pricing tiers, data quality, ease of integration
   - Other options (Open Food Facts, Edamam, etc.)

3. **Integration approach**
   - How to structure a multi-region food database?
   - How to handle ingredient matching between regions?
   - Caching strategy to avoid API costs?
   - Fallback when ingredient not found?

4. **What nutrients to track for fitness market?**
   - Essential: Calories, Protein, Carbs, Fat
   - Important: Fibre, Sugar, Sodium
   - Nice-to-have: Vitamins, minerals, amino acid profile
   - What do competing fitness apps track?

**Deliverable format:**
```markdown
## Recommended Approach
[Summary recommendation]

## Australian Options
[Detailed analysis of each]

## USA Options
[Detailed analysis of each]

## Integration Architecture
[Technical approach]

## Estimated Effort
[Time to implement]
```

---

### TASK 2: Recipe Database & Copyright Analysis
**Assignee:** @market-researcher + @tech-developer  
**Output:** `/docs/research/fitness-pivot/02-recipe-database-analysis.md`

**Questions to answer:**

1. **Current Galveston Diet content - copyright risk assessment**
   - Review current 90 recipes - are any directly copied from Galveston Diet book?
   - What makes a recipe copyrightable vs not? (ingredients lists are not, specific instructions may be)
   - What needs to change to be safely original?
   - Is "Phase 1/2/3" Galveston terminology trademarked?

2. **Building a fitness-focused recipe database**
   - What recipe sources are safe for commercial use?
     - Public domain cookbooks
     - Creative Commons licensed recipes
     - AI-generated recipes (what are the rules?)
     - Original recipes (effort to create)
   - How many recipes needed for viable launch? (50? 100? 200?)
   - What meal types needed for fitness market?
     - High protein breakfasts
     - Pre-workout meals
     - Post-workout meals
     - High protein snacks
     - Meal prep friendly (batch cooking)
     - Budget-conscious options

3. **Recipe categorisation for fitness goals**
   - Cutting (calorie deficit, high protein)
   - Bulking (calorie surplus, high protein, high carb)
   - Maintenance (balanced macros)
   - Competition prep (very strict macros)
   - What macro ratios define each category?

4. **Competitor recipe analysis**
   - How many recipes do competitors offer?
   - Are they original or aggregated?
   - What categories do they use?

**Deliverable format:**
```markdown
## Copyright Risk Assessment
[Analysis of current content]

## Safe Recipe Sources
[List with licensing details]

## Recommended Recipe Categories
[Categories with example meals]

## Recipe Database Build Plan
[How to create 100+ fitness recipes]

## Estimated Effort
[Time to build database]
```

---

### TASK 3: Fitness Market & Methodology Research
**Assignee:** @market-researcher  
**Output:** `/docs/research/fitness-pivot/03-fitness-market-research.md`

**Questions to answer:**

1. **Proven diet methodologies for fitness market**
   - What are the established approaches? (IIFYM/flexible dieting, meal timing, carb cycling, etc.)
   - Which are evidence-based vs bro-science?
   - What do certified sports nutritionists recommend?
   - What methodologies do popular fitness apps use?

2. **Macro calculations for fitness goals**
   - How do fitness apps calculate TDEE?
   - What protein targets are recommended? (g per kg bodyweight)
   - How do macros differ for cutting vs bulking?
   - What's the role of meal timing? (does it matter?)

3. **What do gym-goers actually want in a meal planning app?**
   - Search Reddit (r/fitness, r/mealprepsunday, r/gainit, r/loseit) for complaints about existing apps
   - Search app store reviews for meal planning apps - what's missing?
   - What features are must-have vs nice-to-have?
   - What makes people churn from meal planning apps?

4. **Competitor deep dive**
   - MyFitnessPal - what they do, gaps, pricing
   - MacroFactor - what they do, gaps, pricing  
   - Eat This Much - what they do, gaps, pricing
   - Carbon Diet Coach - what they do, gaps, pricing
   - RP Diet App - what they do, gaps, pricing
   - What do they do well? What do users complain about?

5. **Influencer/social proof landscape**
   - What fitness influencers promote meal planning?
   - What would make them want to promote GetFed?
   - Typical influencer rates for fitness apps?
   - User-generated content opportunities?

**Deliverable format:**
```markdown
## Proven Methodologies
[Evidence-based approaches]

## Macro Calculation Standards
[How to calculate for different goals]

## User Pain Points
[What's missing in current apps - with sources]

## Competitor Analysis
[Matrix comparison]

## Influencer Landscape
[Opportunities and costs]

## Recommended Positioning
[Where GetFed can differentiate]
```

---

### TASK 4: Current MVP Audit
**Assignee:** @tech-developer  
**Output:** `/docs/research/fitness-pivot/04-mvp-audit.md`

**Review the current codebase and answer:**

1. **What works well in current MVP?**
   - User flows that are smooth
   - Technical implementation that's solid
   - Features users would expect to keep

2. **What doesn't work / needs fixing?**
   - Bugs or rough edges
   - Confusing UX
   - Performance issues
   - Mobile experience gaps

3. **What's Galveston-specific that needs generalising?**
   - Hardcoded Phase 1/2/3 logic
   - Meal timing (no breakfast)
   - Recipe filtering assumptions
   - Macro ratio calculations
   - UI copy/branding

4. **What can be removed/simplified?**
   - Features that add complexity without value
   - Code that's over-engineered
   - Unused components

5. **What's missing for fitness market?**
   - Onboarding flow (goal selection, stats input)
   - Breakfast meals
   - More diet flexibility (not just one diet)
   - User accounts / authentication
   - Payment integration
   - Progress tracking?
   - Workout integration?

6. **AI usage assessment**
   - Where is Claude API currently used?
   - What's the cost per user action?
   - Where could AI add more value?
   - Where is AI overkill / should be static?

**Deliverable format:**
```markdown
## What Works Well
[List with reasoning]

## What Needs Fixing
[Prioritised list]

## Galveston-Specific Code to Generalise
[List with file locations]

## Recommended Removals
[What to cut]

## Missing for Fitness Market
[Gap list with priority]

## AI Usage Analysis
[Current vs recommended]

## Refactoring Estimate
[Time to transform MVP]
```

---

### TASK 5: UI/UX Competitive Analysis
**Assignee:** @market-researcher or @tech-developer  
**Output:** `/docs/research/fitness-pivot/05-ui-ux-analysis.md`

**Questions to answer:**

1. **Screenshot/analyse top fitness meal planning apps**
   - What does their onboarding look like?
   - How do they display meal plans?
   - How do they handle meal swaps?
   - Shopping list UX?
   - What makes them feel "premium"?

2. **Current GetFed UX review**
   - What's working in current mobile UX?
   - What feels clunky or confusing?
   - Where do users get stuck?
   - What would a fitness user expect that's missing?

3. **Design patterns for fitness apps**
   - Common colour schemes (dark mode popular?)
   - Typography choices
   - Data visualisation (macros, progress)
   - Gamification elements?

4. **Recommendations for GetFed redesign**
   - Quick wins (low effort, high impact)
   - Medium effort improvements
   - Major redesign considerations

**Deliverable format:**
```markdown
## Competitor UI/UX Screenshots
[Analysis of top 5 apps]

## Current GetFed UX Assessment
[Strengths and weaknesses]

## Design Pattern Recommendations
[What to adopt]

## Redesign Priority List
[Quick wins → major changes]
```

---

### TASK 6: Business Model & Pricing Research
**Assignee:** @market-researcher  
**Output:** `/docs/research/fitness-pivot/06-business-model-research.md`

**Questions to answer:**

1. **How do fitness meal planning apps monetise?**
   - Subscription tiers and pricing (AUD and USD)
   - Free vs paid feature gates
   - Annual vs monthly pricing psychology
   - Family/household pricing?

2. **What's the willingness to pay?**
   - Search for data on fitness app spending
   - What do gym memberships cost? (anchor pricing)
   - What do meal delivery services cost? (value comparison)

3. **In-app purchase opportunities**
   - Recipe packs
   - Coaching add-ons
   - White-label for PTs
   - Affiliate (supplements, meal prep containers, etc.)

4. **Conversion benchmarks**
   - Free trial → paid conversion rates for fitness apps
   - Monthly → annual conversion
   - Typical churn rates

5. **Recommended pricing for GetFed**
   - Launch pricing strategy
   - Long-term pricing strategy
   - A/B testing approach

**Deliverable format:**
```markdown
## Competitor Pricing Matrix
[All competitors with tiers]

## Willingness to Pay Data
[Research findings]

## Monetisation Opportunities
[Beyond subscriptions]

## Industry Benchmarks
[Conversion, churn, LTV]

## Recommended GetFed Pricing
[Specific tiers and prices]
```

---

## Execution Instructions

### For @tech-developer

```bash
cd ~/Documents/agent-workspace/projects/active/adaptive-meal-builder

# Create research directory
mkdir -p docs/research/fitness-pivot

# Complete Tasks 1, 4, and contribute to 2 and 5
# Use web search for technical research
# Review codebase for MVP audit
# Output markdown files to docs/research/fitness-pivot/
```

### For @market-researcher

```bash
cd ~/Documents/agent-workspace/projects/active/adaptive-meal-builder

# Complete Tasks 2, 3, 5, and 6
# Use web search extensively
# Check Reddit, app stores, competitor sites
# Output markdown files to docs/research/fitness-pivot/
```

---

## Timeline

| Task | Owner | Estimated Time |
|------|-------|----------------|
| 1. Nutritional Databases | @tech-developer | 2-3 hours |
| 2. Recipe/Copyright | Both | 2-3 hours |
| 3. Fitness Market | @market-researcher | 3-4 hours |
| 4. MVP Audit | @tech-developer | 2-3 hours |
| 5. UI/UX Analysis | Either | 2-3 hours |
| 6. Business Model | @market-researcher | 2-3 hours |

**Total:** 12-18 hours of agent work

---

## Success Criteria

Research is complete when we can answer:

1. ✅ What nutritional database to use and how to integrate it
2. ✅ Whether current recipes have copyright issues
3. ✅ How to build a safe, comprehensive fitness recipe database
4. ✅ What macro methodologies are proven for fitness goals
5. ✅ What competitors do well and where gaps exist
6. ✅ What to keep, change, and add in current MVP
7. ✅ What UI/UX changes would make GetFed competitive
8. ✅ What pricing model to launch with
9. ✅ Clear build plan with time estimates

---

## After Research

Once all 6 deliverables are complete, Desktop Claude will:

1. Synthesise findings into a **GetFed Fitness Pivot Specification**
2. Create prioritised **Build Plan** with phases
3. Estimate total effort to launch-ready
4. Identify any go/no-go decision points

---

*Brief created: 29 December 2025*
