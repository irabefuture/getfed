# Recipe Database Analysis - Copyright & Content Strategy

**Date:** 29 December 2025
**Researcher:** @tech-developer (technical/legal) + @market-researcher (database options)

---

## Executive Summary

**Critical Finding:** All 90+ current recipes are sourced from "The Galveston Diet" book.
- Recipe names, descriptions, and instructions may be copyrightable creative expression
- Ingredient lists alone are NOT copyrightable, but substantial literary expression IS
- **Recommendation:** Replace entire recipe database with original/AI-generated content before commercial launch

---

## Part 1: Current Recipe Content Audit (Technical)

### Source Analysis

```
Recipe Files Audited:
├── breakfast.json       → source: "galveston_book" (all recipes)
├── dinner-mains.json    → source: "galveston_book" (all recipes)
├── lunch-mains.json     → source: "galveston_book" (all recipes)
├── smoothies.json       → source: "galveston_book" (all recipes)
├── snacks-afternoon.json → source: "galveston_book" (all recipes)
└── snacks-evening.json  → source: "galveston_book" (all recipes)

Total: ~90 recipes
Source: 100% from Galveston Diet book
```

### Example Recipe Structure (from dinner-mains.json)

```json
{
  "id": "sesame-ginger-pork-green-beans",
  "name": "Sesame Ginger Pork with Green Beans",           // ⚠️ Potentially copyrightable name
  "description": "Asian-inspired pork strips...",          // ⚠️ Literary expression
  "source": "galveston_book",
  "source_ref": "p.186",                                   // Direct page reference
  "ingredients": [...],                                    // ✅ Not copyrightable
  "instructions": [                                        // ⚠️ Literary expression
    "Place the sesame seeds in a small frypan...",
    "Lightly coat a medium frypan with cooking spray..."
  ]
}
```

### What's Copyrightable in Recipes

| Element | Copyrightable? | Notes |
|---------|----------------|-------|
| **Ingredient lists** | NO | Factual content, explicitly not protected |
| **Basic instructions** | NO | "Simple set of directions" not protected |
| **Recipe names** | MAYBE | If creatively unique (not generic like "Chicken Stir Fry") |
| **Descriptions** | YES | Literary expression is protected |
| **Detailed method prose** | YES | Substantial literary expression is protected |
| **Recipe collections** | YES | Selection/arrangement can be protected |
| **Photos** | YES | Definitely copyrightable |

### Risk Assessment

| Risk | Level | Rationale |
|------|-------|-----------|
| Using Galveston recipes commercially | **HIGH** | Page references prove direct extraction; book is recent (2023) |
| Copyright claim from publisher | **MEDIUM-HIGH** | Commercial use of extracted book content is infringement |
| Cease & desist | **MEDIUM** | Publisher may not notice small SaaS, but risk exists |
| Lawsuit | **LOW** | Expensive for publisher, but possible if app gains traction |

**Bottom line:** Current recipes cannot be used commercially without significant legal risk.

---

## Part 2: AI-Generated Recipes - Legal Status

### Can Claude Generate Commercial Recipes?

**Yes, with the Claude API (Commercial/Enterprise terms).**

| Plan | Output Ownership | Commercial Use |
|------|------------------|----------------|
| Claude.ai Free/Pro | Limited (consumer terms) | Restricted |
| Claude API | Customer owns outputs | Yes, fully permitted |
| Claude Enterprise | Customer owns outputs | Yes, with indemnification |

From [Anthropic's Commercial Terms](https://www.anthropic.com/news/expanded-legal-protections-api-improvements):
> "Anthropic hereby assigns to Customer its right, title and interest (if any) in and to Outputs."

### Copyright of AI-Generated Content

**Key principle:** Pure AI output without significant human involvement is NOT copyrightable by ANYONE.

| Scenario | Copyright Status | Commercial Use |
|----------|------------------|----------------|
| AI generates recipe, human uses as-is | Not copyrightable | Can use, but can't prevent copying |
| Human significantly modifies AI output | Copyrightable (human contribution) | Can use, can protect |
| Human provides creative direction/selection | Partially copyrightable | Can use, limited protection |

**For GetFed:** This is actually fine because:
1. Recipes are functional content - users don't expect exclusive rights
2. We're providing a service (meal planning), not selling recipes
3. Competitors can't easily extract and reuse our exact implementation

### Recipe Generation Strategy

**Recommended approach:**
1. Use Claude API to generate original recipes
2. Human review for quality, safety, and accuracy
3. Modify/enhance with personal touches
4. Store with "ai_generated" source tag

```json
{
  "id": "high-protein-chicken-bowl",
  "name": "High Protein Chicken Power Bowl",
  "source": "ai_generated",
  "source_ref": "Claude API, Dec 2025",
  "human_reviewed": true,
  "reviewed_by": "Ian",
  "review_date": "2025-12-30",
  ...
}
```

---

## Part 3: Safe Recipe Sources for Commercial Use

### Public Domain Cookbooks

| Source | Availability | Notes |
|--------|--------------|-------|
| **Pre-1928 US cookbooks** | Project Gutenberg | Copyright expired, fully public domain |
| **Australian pre-1955** | Trove (NLA) | Check specific work's status |
| **Government publications** | Direct | USDA, FSANZ recipes are public domain |

**Examples:**
- "Fannie Farmer's Boston Cooking-School Cook Book" (1896)
- "Mrs. Beeton's Book of Household Management" (1861)
- USDA MyPlate recipes

**Limitation:** Old recipes may not fit modern fitness nutrition profiles

### Creative Commons Licensed Sources

| Source | Licence | Commercial OK? |
|--------|---------|----------------|
| **Wikimedia Cookbook** | CC BY-SA | Yes, with attribution |
| **Open Source Food** | Various CC | Check specific licence |
| **Some food blogs** | CC BY | Yes, with attribution |

**Note:** Must comply with licence terms (usually attribution required)

### AI Generation (Recommended)

| Approach | Pros | Cons |
|----------|------|------|
| **Claude API** | Fast, customisable, owned | Needs human review, costs |
| **Bulk generation** | Can create 500+ recipes cheaply | Quality varies |
| **Template-based** | Consistent structure | Less variety |

**Cost estimate:** ~$0.02-0.05 per recipe with Claude Sonnet

### Professional Recipe Development

| Approach | Cost | Quality |
|----------|------|---------|
| **Hire nutritionist/chef** | $50-200/recipe | Highest |
| **Freelance recipe developer** | $20-50/recipe | Good |
| **Crowdsource (with rights transfer)** | $5-20/recipe | Variable |

---

## Part 4: Recommended Action Plan

### Phase 1: Immediate (Before Any Commercial Use)

1. **Remove all Galveston book references** from production code
2. **Generate replacement recipes** using Claude API
3. **Human review** each generated recipe for:
   - Nutritional accuracy
   - Cooking method safety
   - Ingredient availability (AU market)
   - Taste/appeal (where possible, test)

### Phase 2: Recipe Database Expansion

**For fitness pivot, need new categories:**

| Category | Current Count | Needed | Notes |
|----------|---------------|--------|-------|
| **Breakfast** | 0 (no breakfast in Galveston) | 20-30 | High priority for fitness |
| **High-protein mains** | ~30 | 50+ | Core fitness demographic |
| **Pre/post workout** | 0 | 10-15 | Quick, carb-focused |
| **Meal prep friendly** | ~20 | 40+ | Batch cooking is key |
| **Low-cal snacks** | ~20 | 20 | Cutting phase |
| **High-cal snacks** | ~5 | 15 | Bulking phase |

**Total new recipes needed:** ~100-150 (to replace 90 Galveston + expand)

### Phase 3: Quality Assurance

1. **Nutritional validation** - verify calculated macros are accurate
2. **Cooking instructions** - ensure methods are clear and correct
3. **Ingredient sourcing** - confirm AU availability
4. **Photography** (optional) - stock photos or AI-generated images

---

## Legal Summary

### What We CANNOT Do:
- Use Galveston Diet recipes commercially (clear infringement)
- Copy recipes from other commercial cookbooks/apps
- Use photos from the book

### What We CAN Do:
- Generate original recipes with Claude API (we own outputs)
- Use public domain recipes (pre-1928 US, pre-1955 AU)
- Use Creative Commons licensed recipes (with attribution)
- Adapt traditional recipes with original descriptions
- Use the same ingredients in different combinations

### Recommended Legal Statement for GetFed:
> "Recipes in GetFed are original creations generated and reviewed by our team. Nutritional information is calculated using [FSANZ AFCD/USDA FoodData Central]. Some recipes may be inspired by traditional cooking methods."

---

## Cost/Time Estimates

| Task | Time | Cost |
|------|------|------|
| Generate 150 recipes via Claude API | 2-3 days | ~$5-10 in API costs |
| Human review & editing | 3-5 days | Owner time |
| Nutritional validation | 1-2 days | Owner time |
| Replace database & test | 1 day | Owner time |
| **Total** | **7-11 days** | **~$10** |

---

## Sources

- [Copyright Alliance - Are Recipes Protected?](https://copyrightalliance.org/are-recipes-cookbooks-protected-by-copyright/)
- [US Copyright Office - Circular 33 (Works Not Protected)](https://www.copyright.gov/circs/circ33.pdf)
- [Copyrightlaws.com - Copyright Protection in Recipes](https://www.copyrightlaws.com/copyright-protection-recipes/)
- [Anthropic - Expanded Legal Protections for API](https://www.anthropic.com/news/expanded-legal-protections-api-improvements)
- [Terms.law - Who Owns Claude Output?](https://terms.law/2023/07/16/who-owns-the-output-of-claude-chatgpt-decoding-tos-copyright-law/)
- [Congress.gov - Generative AI and Copyright Law](https://www.congress.gov/crs-product/LSB10922)

---

## Part 5: Market Research - Recipe Database Analysis

*Added by @market-researcher - 29 December 2025*

---

### Competitor Recipe Offerings

| Competitor | Recipe Count | Categories | Original? | Notes |
|------------|--------------|------------|-----------|-------|
| **Eat This Much** | 5,000+ | 10+ | Mix | AI-generated + curated |
| **Mealime** | 1,000+ | 7 | Original | Focus on weeknight dinners |
| **PlateJoy** | 1,000+ | 14 diets | Original | Nutritionist-designed |
| **RP Diet** | N/A | Food categories | N/A | Prescribes food types, not recipes |
| **Meal Prep Manual** | 200+ | 6 | Original | Fitness-focused |
| **Fit Men Cook** | 100+ | 5 | Original | Male fitness audience |
| **Skinnytaste** | 2,000+ | 15+ | Original | Weight loss focus |

**Key insight:** Pure fitness meal planning apps have 200-1,000 recipes. General healthy eating apps have 1,000-5,000+. Minimum viable is 100+.

---

### Recommended Recipe Categories for Fitness Market

#### Breakfast (Essential - 15+ recipes)

| Subcategory | Examples | Macro Focus |
|-------------|----------|-------------|
| **Protein-heavy** | Protein pancakes, egg white omelettes | High P, Mod C |
| **Overnight oats variations** | Chocolate PB, Berry, Apple pie | Balanced |
| **Egg-based** | Scrambles, frittatas, egg muffins | High P, Low C |
| **Smoothie bowls** | Protein smoothie bases | High P, Mod C |
| **Quick grab-and-go** | Protein bars, muffins | Balanced |

**Note:** Critical gap in current Galveston recipes (no breakfast due to IF focus).

#### Pre-Workout Meals (10+ recipes)

| Subcategory | Examples | Timing |
|-------------|----------|--------|
| **Quick carbs** | Banana + nut butter, rice cakes | 30-60 min before |
| **Complex carbs** | Oatmeal + protein, whole grain toast | 1-2 hours before |
| **Light options** | Fruit + yogurt, protein shake | 30 min before |

**Key:** Low-fat (slows digestion), moderate protein, carb-focused for energy.

#### Post-Workout Meals (15+ recipes)

| Subcategory | Examples | Timing |
|-------------|----------|--------|
| **Fast protein + carbs** | Chicken + rice, protein smoothie | Within 1-2 hours |
| **Recovery bowls** | Greek yogurt parfaits, acai bowls | Any time after |
| **Complete meals** | Stir-fry + rice, pasta + chicken | 1-2 hours after |

#### Meal Prep Staples (20+ recipes)

| Subcategory | Examples | Why Essential |
|-------------|----------|---------------|
| **Batch proteins** | Slow cooker chicken, baked fish | Base for multiple meals |
| **Carb bases** | Rice, sweet potato, pasta | Prep once, use all week |
| **Complete meals** | Buddha bowls, burrito bowls, sheet pan dinners | Grab and go |

**Key insight:** Fitness users prioritise "meal prep friendly" - recipes that keep well, reheat well, and scale easily.

#### Cutting Meals (15+ recipes)

| Focus | Examples |
|-------|----------|
| **High volume, low cal** | Massive salads, vegetable stir-fry |
| **Protein-packed** | Egg white dishes, lean fish |
| **Satisfying swaps** | Cauliflower rice bowls, zucchini noodles |

#### Bulking Meals (15+ recipes)

| Focus | Examples |
|-------|----------|
| **Calorie dense** | Loaded sweet potato, beef stir-fry |
| **Easy eating** | Smoothies, shakes, overnight oats |
| **Mass gainers** | Homemade weight gain shakes (500+ cal) |

---

### Macro Ratios by Goal

| Goal | Protein | Carbs | Fat | Notes |
|------|---------|-------|-----|-------|
| **Cutting (standard)** | 40% | 30% | 30% | High protein preserves muscle |
| **Cutting (low-carb)** | 40% | 20% | 40% | For carb-sensitive individuals |
| **Maintenance** | 30% | 40% | 30% | Balanced approach |
| **Lean bulk** | 25% | 50% | 25% | Minimise fat gain |
| **Standard bulk** | 25% | 50% | 25% | +300-500 calories |

**Protein by bodyweight:**
- Cutting: 1.8-2.7 g/kg (higher to preserve muscle during deficit)
- Bulking: 1.6-2.2 g/kg (less needed during surplus)

**Sources:** [BarBend](https://barbend.com/protein-intake-calculator/), [ISSN](https://pmc.ncbi.nlm.nih.gov/articles/PMC5596471/)

---

### Recipe Sourcing Strategy (Market Perspective)

#### Fitness Recipe Inspiration Sources

| Site | Focus | Use For |
|------|-------|---------|
| **Fit Men Cook** | Male fitness, meal prep | Concept inspiration |
| **Skinnytaste** | Weight loss, calorie counting | Recipe structures |
| **Meal Prep on Fleek** | Meal prep, macros | Fitness-specific formats |
| **MYPROTEIN Zone** | Muscle building | Supplement-friendly recipes |
| **PureGym** | Gym-goer meals | Simple, practical ideas |

**DO:** Use for category inspiration and format ideas
**DON'T:** Copy recipes directly (create original versions)

#### Community Recipe Potential (Post-Launch)

**Reddit communities to monitor:**
- r/mealprepsunday - User meal preps (1.9M members)
- r/fitmeals - Fitness recipes (400K members)
- r/gainit - Bulking recipes (500K members)
- r/1500isplenty - Low calorie (300K members)

**Strategy:** Launch with curated database, add user submission feature post-launch.

---

### Minimum Viable Launch Requirements

| Category | Minimum | Target | Priority |
|----------|---------|--------|----------|
| Breakfast | 10 | 15 | **HIGH** |
| Pre-workout | 5 | 10 | Medium |
| Post-workout | 10 | 15 | **HIGH** |
| Snacks | 10 | 15 | Medium |
| Cutting dinners | 15 | 25 | **HIGH** |
| Bulking dinners | 10 | 15 | Medium |
| Meal prep staples | 15 | 20 | **HIGH** |
| Lunches | 15 | 20 | **HIGH** |
| **TOTAL** | **90** | **135** | - |

**Verdict:**
- **Minimum viable:** 90-100 recipes
- **Comfortable launch:** 130-150 recipes
- **Competitive:** 200+ recipes

---

### Estimated Timeline (Market Researcher View)

Aligns with Tech Developer estimate:

| Phase | Duration | Output |
|-------|----------|--------|
| AI Generation + Review | 1-2 weeks | 100 base recipes |
| Category Expansion | 1 week | +50 recipes for fitness categories |
| Macro Verification | 3-5 days | Accurate nutritional data |
| **TOTAL** | **2-4 weeks** | **100-150 launch recipes** |

---

### Recipe Database Structure Recommendations

Each recipe should include for fitness users:

| Field | Required | Why |
|-------|----------|-----|
| Calories per serve | Yes | Core metric |
| Protein (g) | Yes | Most important macro for fitness |
| Carbs (g) | Yes | Training fuel |
| Fat (g) | Yes | Hormone health |
| Fibre (g) | Recommended | Satiety, gut health |
| Prep time | Yes | Time-poor users |
| Meal prep friendly | Yes | Boolean flag |
| Reheat instructions | If applicable | Meal prep quality |
| Goal tags | Yes | Cutting/bulking/maintenance |

---

*Market research portion complete - 29 December 2025*
