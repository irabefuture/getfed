-- Migration: Add household support to planned_meals
-- Run this in Supabase SQL Editor
-- Date: 10 December 2025

-- 1. Add new columns
ALTER TABLE planned_meals
ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS excluded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recipe_id text;

-- 2. Drop old constraints
ALTER TABLE planned_meals DROP CONSTRAINT IF EXISTS planned_meals_date_meal_type_key;
ALTER TABLE planned_meals DROP CONSTRAINT IF EXISTS planned_meals_meal_type_check;

-- 3. Add updated meal_type check (matching app slot IDs)
ALTER TABLE planned_meals ADD CONSTRAINT planned_meals_meal_type_check
  CHECK (meal_type IN ('lunch', 'snack_afternoon', 'dinner', 'snack_evening'));

-- 4. New unique constraint per household
ALTER TABLE planned_meals ADD CONSTRAINT planned_meals_household_date_meal_unique
  UNIQUE(household_id, date, meal_type);

-- 5. Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_planned_meals_household ON planned_meals(household_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_household_date ON planned_meals(household_id, date);

-- 6. Update RLS policies for household-based access
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their household meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can insert their household meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can update their household meals" ON planned_meals;
DROP POLICY IF EXISTS "Users can delete their household meals" ON planned_meals;

-- For now, allow all authenticated access (simple staging setup)
-- In production, you'd restrict to household members
CREATE POLICY "Allow all access to planned_meals" ON planned_meals
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON COLUMN planned_meals.household_id IS 'Links meal to household for multi-user support';
COMMENT ON COLUMN planned_meals.excluded IS 'True if excluded from shopping list';
COMMENT ON COLUMN planned_meals.recipe_id IS 'Hash/ID for recipe deduplication and ratings linkage';
