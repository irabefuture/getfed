# Nutritional Database Analysis

**Date:** 29 December 2025
**Researcher:** @tech-developer

---

## Recommended Approach

**Primary recommendation: USDA FoodData Central** for core nutrient data
- Free, public domain, no licensing fees
- 380,000+ foods with comprehensive nutrient profiles
- 1,000 requests/hour rate limit (can request higher)
- Well-documented REST API

**Secondary/Regional: FSANZ AFCD** for Australian-specific foods
- Free under Creative Commons licence
- 1,588 foods with up to 268 nutrients each
- Bulk download (no API) - cache locally

**Avoid for MVP: Nutritionix and Edamam**
- Expensive for commercial use ($1,850+/month)
- Adds complexity without clear benefit for recipe-based app
- Consider later if user-submitted food logging is added

---

## Australian Options

### FSANZ Australian Food Composition Database (AFCD)
*Previously called NUTTAB*

| Aspect | Details |
|--------|---------|
| **Foods covered** | 1,588 foods commonly available in Australia |
| **Nutrients per food** | Up to 268 nutrients |
| **Latest release** | AUSNUT 2023 (study ran Jan 2023 - Mar 2024) |
| **Format** | CSV/Excel bulk download |
| **API** | No dedicated API - bulk download only |
| **Licensing** | Creative Commons Attribution-ShareAlike 3.0 Australia |
| **Commercial use** | Yes, with attribution to FSANZ |
| **Cost** | Free |

**Data includes:**
- Macronutrients (protein, fat, carbs, fibre)
- Vitamins (A, B1, B2, B3, B5, B6, B12, C, D, E, K, folate)
- Minerals (calcium, iron, magnesium, phosphorus, potassium, sodium, zinc)
- Amino acids
- Fatty acid profiles

**Access:**
- Website: [foodstandards.gov.au](https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd)
- Data.gov.au: [Dataset page](https://data.gov.au/data/dataset/http-www-foodstandards-gov-au-science-monitoringnutrients-afcd-pages-default-aspx)
- Licence: [Data User Licence Agreement](https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement)

**Integration approach:**
1. Download bulk data files
2. Import into Supabase as reference table
3. Use for Australian ingredient lookups
4. Update annually when new releases published

### AUSNUT 2023

AUSNUT (Australian Food, Supplement and Nutrient Database) is the comprehensive version containing:
- All AFCD foods
- Dietary supplements
- Recipe calculations

For GetFed, AFCD is sufficient as we're working with raw ingredients.

---

## USA Options

### USDA FoodData Central
*Recommended as primary database*

| Aspect | Details |
|--------|---------|
| **Foods covered** | 380,000+ foods |
| **Data types** | Foundation Foods, SR Legacy, Branded Foods, Survey Foods |
| **API** | Full REST API with OpenAPI spec |
| **Rate limits** | 1,000 requests/hour (can request higher) |
| **Licensing** | Public Domain (CC0 1.0 Universal) |
| **Commercial use** | Yes, no permission needed |
| **Cost** | Free |
| **Updates** | Quarterly |

**API Endpoints:**
- `GET /v1/food/{fdcId}` - Get specific food
- `GET /v1/foods/search` - Search foods by query
- `GET /v1/foods/list` - Get multiple foods by IDs
- `POST /v1/foods` - Get foods by list of IDs

**API Documentation:**
- [API Guide](https://fdc.nal.usda.gov/api-guide/)
- [API Key Signup](https://fdc.nal.usda.gov/api-key-signup/)
- [OpenAPI Spec](https://fdc.nal.usda.gov/api-spec/fdc_api.html)
- [FAQs](https://fdc.nal.usda.gov/faq/)

**Key features:**
- Natural language search
- Multiple food data types (raw ingredients, branded products)
- Comprehensive nutrient profiles
- Well-validated data from federal standards

### Nutritionix
*Not recommended for MVP*

| Aspect | Details |
|--------|---------|
| **Foods covered** | 1.9M+ food items |
| **API calls** | 700M/month across platform |
| **Free tier** | No longer available (was abused) |
| **Pricing** | Enterprise starts at $1,850/month |
| **Best for** | Consumer calorie tracking apps, restaurant meals |

**Why not for GetFed:**
- Expensive for early-stage SaaS
- Overkill for recipe-based app (we define the recipes)
- Better suited for user-logged food (not our use case)
- Could consider later if adding food logging feature

**Contact:** Must request trial account with project details

### Edamam
*Not recommended for MVP*

| Aspect | Details |
|--------|---------|
| **Foods covered** | 900,000+ foods, 680,000+ UPCs, 2.3M recipes |
| **Free tier** | Limited, restrictive rate limits |
| **Nutrition API** | Free to $49/month to custom |
| **Food Database API** | Free to $799/month |
| **Recipe API** | Up to $999/month |
| **Nutrients tracked** | 150+ nutrients |
| **Diets/allergens** | 40+ supported |

**Key feature:** Natural language parsing ("1 cup cooked brown rice")

**Caching rules:**
- Only 4 macros can be cached (protein, fat, carbs, calories)
- Full nutrient data requires live calls

**Why not for GetFed:**
- Pricing scales significantly with usage
- Recipe API is expensive ($999/month)
- NLP is useful for food logging, not recipe definitions
- Consider later for user-submitted recipes

### Open Food Facts
*Good free alternative, with caveats*

| Aspect | Details |
|--------|---------|
| **Foods covered** | 4M+ products from 150 countries |
| **API** | Free REST API |
| **Licensing** | Open Database License (ODbL) |
| **Commercial use** | Yes, completely free |
| **Cost** | Free |
| **Quality** | Variable (crowdsourced) |
| **Recognition** | UN Digital Public Good (Dec 2024) |

**Additional data:**
- Nutri-Score (if category + nutrients provided)
- NOVA group (ultra-processing rating)
- Eco-Score (environmental impact)
- Allergens, additives
- Vegan/vegetarian status

**Staging environment:** https://world.openfoodfacts.net (for testing)

**Limitations:**
- Crowdsourced = variable data quality
- Better for packaged products than raw ingredients
- Limited structured recipe ingredient data
- Best used as supplementary source

---

## Integration Architecture

### Recommended Multi-Region Strategy

```
┌─────────────────────────────────────────────────────┐
│                    GetFed App                        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Ingredient Lookup Service               │
│  1. Check local cache (Supabase ingredients table)  │
│  2. If not found, check FSANZ AFCD (AU foods)       │
│  3. If not found, query USDA FDC API                │
│  4. Cache result for future use                     │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Local Cache │  │ FSANZ AFCD  │  │ USDA FDC    │
│ (Supabase)  │  │ (AU foods)  │  │ API         │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Implementation Steps

1. **Pre-populate ingredient table**
   - Import FSANZ AFCD bulk data into Supabase
   - ~1,588 Australian foods with full nutrient profiles
   - Include AU-specific names and unit conversions

2. **Recipe-level nutrition**
   - Calculate nutrition from ingredient totals (current approach)
   - Store calculated per_serve nutrition in recipe JSON
   - Only need ingredient lookups for new/modified recipes

3. **USDA API integration (optional)**
   - Use for ingredients not in FSANZ
   - Cache results in Supabase
   - Rate limit: 1,000/hour is plenty for admin/recipe creation

4. **Ingredient matching**
   ```javascript
   // Example structure
   const ingredientLookup = {
     'chicken-breast': {
       au_name: 'Chicken breast',
       us_name: 'Chicken, broilers or fryers, breast, meat only',
       fsanz_id: 'F001234',
       usda_fdc_id: 171077,
       per_100g: {
         calories: 165,
         protein_g: 31,
         fat_g: 3.6,
         carbs_g: 0,
         fibre_g: 0,
         // ... more nutrients
       }
     }
   }
   ```

### Caching Strategy

| Data Type | Cache Duration | Storage |
|-----------|----------------|---------|
| FSANZ AFCD data | 1 year (until new release) | Supabase table |
| USDA API results | 90 days | Supabase table |
| Recipe calculations | Permanent (until recipe edited) | recipe JSON |
| Open Food Facts | 30 days | Supabase table |

### Fallback Chain

1. **Known ingredient ID** → Use cached data
2. **New AU ingredient** → Check FSANZ AFCD
3. **New US ingredient** → Query USDA FDC API
4. **Generic ingredient** → Query USDA FDC API
5. **Not found** → Flag for manual entry, use estimates

---

## Nutrients to Track for Fitness Market

### Essential (Must Have - Track in MVP)

| Nutrient | Why Essential for Fitness |
|----------|---------------------------|
| **Calories** | Energy balance for cut/bulk |
| **Protein (g)** | Muscle building/preservation |
| **Carbs (g)** | Energy, workout fuel |
| **Fat (g)** | Hormones, satiety |
| **Fibre (g)** | Satiety, digestion |

### Important (Should Have - Add in v1.1)

| Nutrient | Why Important |
|----------|---------------|
| **Sugar (g)** | Avoid excess, glycemic control |
| **Sodium (mg)** | Water retention, performance |
| **Saturated fat (g)** | Heart health |
| **Cholesterol (mg)** | Some users track this |

### Nice-to-Have (Add in v2+)

| Nutrient | Use Case |
|----------|----------|
| Potassium | Electrolyte balance, cramp prevention |
| Calcium | Bone health |
| Iron | Energy, oxygen transport |
| Vitamin D | Often deficient, recovery |
| Vitamin B12 | Energy metabolism |
| Omega-3/6 | Inflammation, recovery |
| Leucine | Muscle protein synthesis (advanced users) |

### What Competitors Track

| App | Nutrients Tracked | Notes |
|-----|-------------------|-------|
| **MacroFactor** | 54 nutrients | Gold standard, includes leucine, omega-3s, alcohol, caffeine |
| **MyFitnessPal** | 14 nutrients | Calories, macros, 6 micronutrients (A, C, calcium, iron, sodium, potassium) |
| **Carbon Diet Coach** | ~8 nutrients | Focused on macros |
| **RP Diet App** | ~8 nutrients | Macros + fibre |

### Recommendation for GetFed

**Phase 1 (MVP):**
- Calories, Protein, Carbs, Fat, Fibre
- Display prominently in meal cards and day totals

**Phase 2 (Post-launch):**
- Add Sugar, Sodium, Saturated Fat
- Show in recipe detail view

**Phase 3 (If user demand):**
- Add micronutrient tracking
- Consider MacroFactor-style "Nutrient Explorer"
- Only worth it if targeting serious athletes

---

## Estimated Effort

| Task | Time | Notes |
|------|------|-------|
| Import FSANZ AFCD to Supabase | 1 day | Bulk import, create indexes |
| Build ingredient lookup service | 1-2 days | Caching layer, fallback logic |
| USDA API integration | 1 day | Simple fetch + cache |
| Update recipe schema for nutrients | 0.5 day | Add fibre, sugar fields |
| UI for nutrient display | 1 day | Day totals, recipe cards |
| **Total** | **4-5 days** | |

---

## Decision Summary

| Option | Cost | Effort | Quality | Recommendation |
|--------|------|--------|---------|----------------|
| USDA FoodData Central | Free | Low | High | **Primary API** |
| FSANZ AFCD | Free | Low | High | **AU foods (bulk import)** |
| Open Food Facts | Free | Medium | Variable | Consider for packaged foods |
| Nutritionix | $1,850+/mo | Low | High | Skip for MVP |
| Edamam | Up to $999/mo | Low | High | Skip for MVP |

---

## Sources

- [FSANZ Food Composition Databases](https://www.foodstandards.gov.au/science-data/food-composition-databases)
- [AUSNUT 2023](https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut)
- [FSANZ Data User Licence](https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement)
- [USDA FoodData Central API Guide](https://fdc.nal.usda.gov/api-guide/)
- [USDA FoodData Central FAQs](https://fdc.nal.usda.gov/faq/)
- [Nutritionix API](https://www.nutritionix.com/api)
- [Edamam Nutrition API](https://developer.edamam.com/edamam-nutrition-api)
- [Open Food Facts Data](https://world.openfoodfacts.org/data)
- [MacroFactor Nutrient Explorer](https://macrofactorapp.com/micronutrients-nutrient-explorer/)
- [MacroFactor vs MyFitnessPal 2025](https://macrofactorapp.com/macrofactor-vs-myfitnesspal-2025/)
- [Top Nutrition APIs 2024](https://www.eatfresh.tech/blog/top-8-nutrition-apis-for-meal-planning-2024)

---

*Analysis complete. Ready for implementation.*
