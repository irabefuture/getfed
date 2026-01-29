-- Migration: Enable Row Level Security (RLS) on all tables
-- Date: 17 December 2025
--
-- This migration:
-- 1. Adds household_id to pantry_staples (schema change needed for RLS)
-- 2. Enables RLS on all 9 tables flagged by Security Advisor
-- 3. Creates appropriate policies for each table
--
-- Key principle: auth.uid() returns the authenticated user's ID
-- Users access data through their household membership

-- ============================================
-- HELPER FUNCTION: Get user's household_id
-- Cached lookup for policy efficiency
-- ============================================

CREATE OR REPLACE FUNCTION auth.user_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT household_id FROM public.users WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION auth.user_household_id() IS 'Returns the household_id for the currently authenticated user';

-- ============================================
-- SCHEMA CHANGE: Add household_id to pantry_staples
-- Required for proper RLS - pantry staples should be per-household
-- ============================================

ALTER TABLE pantry_staples
ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE;

-- Drop the old unique constraint (ingredient_id only)
ALTER TABLE pantry_staples DROP CONSTRAINT IF EXISTS pantry_staples_ingredient_id_key;

-- Add new unique constraint per household
ALTER TABLE pantry_staples ADD CONSTRAINT pantry_staples_household_ingredient_unique
  UNIQUE(household_id, ingredient_id);

CREATE INDEX IF NOT EXISTS idx_pantry_staples_household ON pantry_staples(household_id);

COMMENT ON COLUMN pantry_staples.household_id IS 'Links pantry staple to household - each household has their own pantry list';

-- ============================================
-- 1. USERS TABLE RLS
-- Users can only see/modify their own row
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_delete_own" ON users;

-- SELECT: Users can only see their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (id = auth.uid());

-- INSERT: Users can only create their own profile (id must match auth.uid())
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- UPDATE: Users can only update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Users can only delete their own profile (if needed)
CREATE POLICY "users_delete_own" ON users
  FOR DELETE
  USING (id = auth.uid());

-- ============================================
-- 2. HOUSEHOLDS TABLE RLS
-- Users can access households they belong to
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "households_select_member" ON households;
DROP POLICY IF EXISTS "households_insert_authenticated" ON households;
DROP POLICY IF EXISTS "households_update_member" ON households;
DROP POLICY IF EXISTS "households_delete_member" ON households;

-- SELECT: Users can see households they belong to
CREATE POLICY "households_select_member" ON households
  FOR SELECT
  USING (id = auth.user_household_id());

-- INSERT: Authenticated users can create new households
-- (Typically done during onboarding before household_id is set)
CREATE POLICY "households_insert_authenticated" ON households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can update their own household
CREATE POLICY "households_update_member" ON households
  FOR UPDATE
  USING (id = auth.user_household_id())
  WITH CHECK (id = auth.user_household_id());

-- DELETE: Users can delete their own household
CREATE POLICY "households_delete_member" ON households
  FOR DELETE
  USING (id = auth.user_household_id());

-- ============================================
-- 3. HOUSEHOLD_MEMBERS TABLE RLS
-- Users can access members of their household
-- ============================================

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "household_members_select" ON household_members;
DROP POLICY IF EXISTS "household_members_insert" ON household_members;
DROP POLICY IF EXISTS "household_members_update" ON household_members;
DROP POLICY IF EXISTS "household_members_delete" ON household_members;

-- SELECT: Users can see members of their household
CREATE POLICY "household_members_select" ON household_members
  FOR SELECT
  USING (household_id = auth.user_household_id());

-- INSERT: Users can add members to their household
CREATE POLICY "household_members_insert" ON household_members
  FOR INSERT
  WITH CHECK (household_id = auth.user_household_id());

-- UPDATE: Users can update members of their household
CREATE POLICY "household_members_update" ON household_members
  FOR UPDATE
  USING (household_id = auth.user_household_id())
  WITH CHECK (household_id = auth.user_household_id());

-- DELETE: Users can remove members from their household
CREATE POLICY "household_members_delete" ON household_members
  FOR DELETE
  USING (household_id = auth.user_household_id());

-- ============================================
-- 4. PREFERENCES TABLE RLS
-- Users can only access their own preferences
-- ============================================

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferences_select_own" ON preferences;
DROP POLICY IF EXISTS "preferences_insert_own" ON preferences;
DROP POLICY IF EXISTS "preferences_update_own" ON preferences;
DROP POLICY IF EXISTS "preferences_delete_own" ON preferences;

-- SELECT: Users can see their own preferences
CREATE POLICY "preferences_select_own" ON preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own preferences
CREATE POLICY "preferences_insert_own" ON preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own preferences
CREATE POLICY "preferences_update_own" ON preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own preferences
CREATE POLICY "preferences_delete_own" ON preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 5. INGREDIENTS TABLE RLS
-- Reference data - readable by all authenticated users
-- Writable by authenticated users (for adding new ingredients)
-- ============================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ingredients_select_authenticated" ON ingredients;
DROP POLICY IF EXISTS "ingredients_insert_authenticated" ON ingredients;
DROP POLICY IF EXISTS "ingredients_update_authenticated" ON ingredients;
DROP POLICY IF EXISTS "ingredients_delete_authenticated" ON ingredients;

-- SELECT: All authenticated users can view ingredients
CREATE POLICY "ingredients_select_authenticated" ON ingredients
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Authenticated users can add ingredients
-- (In production, you might restrict this to admins)
CREATE POLICY "ingredients_insert_authenticated" ON ingredients
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Authenticated users can update ingredients
CREATE POLICY "ingredients_update_authenticated" ON ingredients
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Authenticated users can delete ingredients
CREATE POLICY "ingredients_delete_authenticated" ON ingredients
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. PANTRY_STAPLES TABLE RLS
-- Users can access pantry staples for their household
-- ============================================

ALTER TABLE pantry_staples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pantry_staples_select" ON pantry_staples;
DROP POLICY IF EXISTS "pantry_staples_insert" ON pantry_staples;
DROP POLICY IF EXISTS "pantry_staples_update" ON pantry_staples;
DROP POLICY IF EXISTS "pantry_staples_delete" ON pantry_staples;

-- SELECT: Users can see their household's pantry staples
CREATE POLICY "pantry_staples_select" ON pantry_staples
  FOR SELECT
  USING (household_id = auth.user_household_id());

-- INSERT: Users can add pantry staples to their household
CREATE POLICY "pantry_staples_insert" ON pantry_staples
  FOR INSERT
  WITH CHECK (household_id = auth.user_household_id());

-- UPDATE: Users can update their household's pantry staples
CREATE POLICY "pantry_staples_update" ON pantry_staples
  FOR UPDATE
  USING (household_id = auth.user_household_id())
  WITH CHECK (household_id = auth.user_household_id());

-- DELETE: Users can remove pantry staples from their household
CREATE POLICY "pantry_staples_delete" ON pantry_staples
  FOR DELETE
  USING (household_id = auth.user_household_id());

-- ============================================
-- 7. MEAL_LOGS TABLE RLS
-- Users can only access their own meal logs
-- ============================================

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meal_logs_select_own" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_insert_own" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_update_own" ON meal_logs;
DROP POLICY IF EXISTS "meal_logs_delete_own" ON meal_logs;

-- SELECT: Users can see their own meal logs
CREATE POLICY "meal_logs_select_own" ON meal_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own meal logs
CREATE POLICY "meal_logs_insert_own" ON meal_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own meal logs
CREATE POLICY "meal_logs_update_own" ON meal_logs
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own meal logs
CREATE POLICY "meal_logs_delete_own" ON meal_logs
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 8. SAVED_MEALS TABLE RLS
-- Users can only access their own saved meals
-- ============================================

ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_meals_select_own" ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_insert_own" ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_update_own" ON saved_meals;
DROP POLICY IF EXISTS "saved_meals_delete_own" ON saved_meals;

-- SELECT: Users can see their own saved meals
CREATE POLICY "saved_meals_select_own" ON saved_meals
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own saved meals
CREATE POLICY "saved_meals_insert_own" ON saved_meals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own saved meals
CREATE POLICY "saved_meals_update_own" ON saved_meals
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own saved meals
CREATE POLICY "saved_meals_delete_own" ON saved_meals
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 9. RECIPE_RATINGS TABLE RLS
-- Users can only access their own recipe ratings
-- ============================================

ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_ratings_select_own" ON recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_insert_own" ON recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_update_own" ON recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_delete_own" ON recipe_ratings;

-- SELECT: Users can see their own recipe ratings
CREATE POLICY "recipe_ratings_select_own" ON recipe_ratings
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create their own recipe ratings
CREATE POLICY "recipe_ratings_insert_own" ON recipe_ratings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own recipe ratings
CREATE POLICY "recipe_ratings_update_own" ON recipe_ratings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own recipe ratings
CREATE POLICY "recipe_ratings_delete_own" ON recipe_ratings
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 10. PLANNED_MEALS TABLE RLS (UPDATE EXISTING)
-- Replace "allow all" policy with proper household-based access
-- ============================================

-- planned_meals already has RLS enabled from migration 001
-- Drop the permissive "allow all" policy
DROP POLICY IF EXISTS "Allow all access to planned_meals" ON planned_meals;

-- Drop any other existing policies
DROP POLICY IF EXISTS "planned_meals_select" ON planned_meals;
DROP POLICY IF EXISTS "planned_meals_insert" ON planned_meals;
DROP POLICY IF EXISTS "planned_meals_update" ON planned_meals;
DROP POLICY IF EXISTS "planned_meals_delete" ON planned_meals;

-- SELECT: Users can see their household's planned meals
CREATE POLICY "planned_meals_select" ON planned_meals
  FOR SELECT
  USING (household_id = auth.user_household_id());

-- INSERT: Users can add planned meals to their household
CREATE POLICY "planned_meals_insert" ON planned_meals
  FOR INSERT
  WITH CHECK (household_id = auth.user_household_id());

-- UPDATE: Users can update their household's planned meals
CREATE POLICY "planned_meals_update" ON planned_meals
  FOR UPDATE
  USING (household_id = auth.user_household_id())
  WITH CHECK (household_id = auth.user_household_id());

-- DELETE: Users can delete their household's planned meals
CREATE POLICY "planned_meals_delete" ON planned_meals
  FOR DELETE
  USING (household_id = auth.user_household_id());

-- ============================================
-- DONE!
-- RLS is now enabled on all 9 tables
-- ============================================

-- Summary of policies created:
--
-- | Table              | SELECT           | INSERT           | UPDATE           | DELETE           |
-- |--------------------|------------------|------------------|------------------|------------------|
-- | users              | Own row only     | Own row only     | Own row only     | Own row only     |
-- | households         | Own household    | Authenticated    | Own household    | Own household    |
-- | household_members  | Own household    | Own household    | Own household    | Own household    |
-- | preferences        | Own user_id      | Own user_id      | Own user_id      | Own user_id      |
-- | ingredients        | Authenticated    | Authenticated    | Authenticated    | Authenticated    |
-- | pantry_staples     | Own household    | Own household    | Own household    | Own household    |
-- | meal_logs          | Own user_id      | Own user_id      | Own user_id      | Own user_id      |
-- | saved_meals        | Own user_id      | Own user_id      | Own user_id      | Own user_id      |
-- | recipe_ratings     | Own user_id      | Own user_id      | Own user_id      | Own user_id      |
-- | planned_meals      | Own household    | Own household    | Own household    | Own household    |
