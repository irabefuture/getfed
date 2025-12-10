-- Migration: Add recipe_json column to store complete recipe objects
-- This fixes data loss issues where critical fields like base_servings and per_serve were lost
-- Run this in Supabase SQL Editor
-- Date: 11 December 2025

-- 1. Add recipe_json column to store complete recipe object
ALTER TABLE planned_meals
ADD COLUMN IF NOT EXISTS recipe_json jsonb;

COMMENT ON COLUMN planned_meals.recipe_json IS 'Complete recipe object stored as JSON to preserve all fields (base_servings, per_serve, description, batch_notes, etc.)';

-- 2. Add index for recipe_json queries if needed
CREATE INDEX IF NOT EXISTS idx_planned_meals_recipe_json ON planned_meals USING GIN (recipe_json);
