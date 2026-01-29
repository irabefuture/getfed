# GetFed Database Emergency Fix - 29 December 2025

## Issue
App shows "Please set up my profile first" when trying to generate meals, even though 2 users (Ian & Rhonda) should exist.

## Root Cause Analysis
The error occurs in `WeekView.jsx` line ~370:
```javascript
if (!user || !targets) {
  setGenerationError('Please set up your profile first')
}
```

This means either:
1. The `users` table in Supabase is empty
2. The `households` table is empty  
3. The `household_members` table is empty
4. Users exist but have no `household_id` linked

## Diagnostic Steps

### Step 1: Run the diagnostic script
```bash
cd ~/Documents/agent-workspace/projects/active/adaptive-meal-builder
node scripts/check-database.mjs
```

### Step 2: Check Supabase Dashboard directly
Go to: https://supabase.com/dashboard/project/tinpfmxskumjvejpmhqv/editor

Check these tables:
- `users` - Should have Ian and Rhonda
- `households` - Should have "Harris Household"  
- `household_members` - Should have Ian (primary) and Rhonda

### Step 3: If data is missing, re-seed

**Option A: Run full seed SQL in Supabase SQL Editor:**

```sql
-- First, check what exists
SELECT * FROM users;
SELECT * FROM households;
SELECT * FROM household_members;

-- If empty, insert the Harris Household data:

-- 1. Create household
INSERT INTO households (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Harris Household')
ON CONFLICT DO NOTHING;

-- 2. Create Ian (primary member)
INSERT INTO household_members (
    household_id, name, is_primary,
    current_weight_kg, target_weight_kg, height_cm,
    age, sex, activity_level, current_phase
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Ian', true,
    94.8, 88.0, 182,
    57, 'male', 'moderate', 1
)
ON CONFLICT DO NOTHING;

-- 3. Create Rhonda
INSERT INTO household_members (
    household_id, name, is_primary,
    current_weight_kg, target_weight_kg, height_cm,
    age, sex, activity_level, current_phase
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Rhonda', false,
    84.5, 80.0, 175,
    55, 'female', 'moderate', 1
)
ON CONFLICT DO NOTHING;

-- 4. Create/update users and link to household
INSERT INTO users (name, gender, date_of_birth, height_cm, current_weight_kg, target_weight_kg, activity_level, goal, current_phase, household_id)
VALUES 
    ('Ian', 'male', '1968-09-20', 182, 94.8, 88, 'moderate', 'lose', 'phase1', '11111111-1111-1111-1111-111111111111'),
    ('Rhonda', 'female', '1974-05-30', 175, 84.5, 80, 'moderate', 'lose', 'phase1', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET household_id = '11111111-1111-1111-1111-111111111111';

-- 5. Verify
SELECT u.name, u.household_id, h.name as household_name
FROM users u
LEFT JOIN households h ON u.household_id = h.id;

SELECT * FROM household_members;
```

**Option B: If users exist but household_id is NULL:**

```sql
-- Check current state
SELECT id, name, household_id FROM users;

-- If household exists but not linked:
UPDATE users 
SET household_id = '11111111-1111-1111-1111-111111111111'
WHERE household_id IS NULL;

-- Or use the migration function:
SELECT migrate_user_to_household('YOUR-USER-UUID-HERE');
```

### Step 4: Clear browser cache and localStorage

After fixing the database:
1. Open https://adaptive-meal-builder.vercel.app
2. Open DevTools (Cmd+Option+I)
3. Go to Application > Storage > Clear site data
4. Reload the app

### Step 5: Verify fix

1. Open the app
2. Check that Users page shows Ian & Rhonda
3. Try "Generate a day" - should work now

## Files Reference
- Schema: `supabase/schema.sql`
- Seed data: `supabase/seed.sql`  
- User context: `src/context/UserContext.js`
- Household context: `src/context/HouseholdContext.js`
- Error location: `src/components/WeekView.jsx` (handleGenerateWeek function)

## Supabase Dashboard Access
- Project: tinpfmxskumjvejpmhqv
- URL: https://supabase.com/dashboard/project/tinpfmxskumjvejpmhqv
