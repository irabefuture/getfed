#!/usr/bin/env node
/**
 * GetFed Database Diagnostic Script
 * Checks all critical tables and data integrity
 * Run: node scripts/check-database.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tinpfmxskumjvejpmhqv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbnBmbXhza3VtanZlanBtaHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Mjg5MjEsImV4cCI6MjA4MDIwNDkyMX0.Zh2UfACvkmg6Ng9TwHtvFA1OagTecA0exjm0R-JNFPQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 GetFed Database Diagnostic\n');
console.log('='.repeat(50));
console.log(`Supabase URL: ${supabaseUrl}`);

async function runDiagnostics() {
  const issues = [];
  
  // 1. Check users table
  console.log('\n📋 USERS TABLE:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError) {
    console.log('❌ Error:', usersError.message);
    issues.push('Users table query failed');
  } else if (!users || users.length === 0) {
    console.log('⚠️ EMPTY - No users found!');
    issues.push('Users table is empty - needs seed data');
  } else {
    console.log(`✅ Found ${users.length} user(s):`);
    users.forEach(u => {
      console.log(`   - ${u.name} (ID: ${u.id.substring(0,8)}...)`);
      console.log(`     household_id: ${u.household_id || 'NULL ⚠️'}`);
      console.log(`     current_phase: ${u.current_phase}, goal: ${u.goal}`);
      if (!u.household_id) {
        issues.push(`User "${u.name}" has no household_id`);
      }
    });
  }

  // 2. Check households table
  console.log('\n🏠 HOUSEHOLDS TABLE:');
  const { data: households, error: householdsError } = await supabase
    .from('households')
    .select('*');

  if (householdsError) {
    console.log('❌ Error:', householdsError.message);
    issues.push('Households table query failed');
  } else if (!households || households.length === 0) {
    console.log('⚠️ EMPTY - No households found!');
    issues.push('Households table is empty - needs seed data');
  } else {
    console.log(`✅ Found ${households.length} household(s):`);
    households.forEach(h => {
      console.log(`   - ${h.name} (ID: ${h.id})`);
    });
  }

  // 3. Check household_members table
  console.log('\n👥 HOUSEHOLD MEMBERS TABLE:');
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('*');

  if (membersError) {
    console.log('❌ Error:', membersError.message);
    issues.push('Household members table query failed');
  } else if (!members || members.length === 0) {
    console.log('⚠️ EMPTY - No household members found!');
    issues.push('Household members table is empty - needs seed data');
  } else {
    console.log(`✅ Found ${members.length} member(s):`);
    members.forEach(m => {
      console.log(`   - ${m.name}`);
      console.log(`     Phase ${m.current_phase}, ${m.current_weight_kg}kg → ${m.target_weight_kg}kg`);
      console.log(`     primary: ${m.is_primary}, household: ${m.household_id?.substring(0,8)}...`);
    });
  }

  // 4. Check meal_plans (the actual planned meals by household)
  console.log('\n📅 MEAL PLANS TABLE:');
  const { data: mealPlans, error: mealPlansError } = await supabase
    .from('meal_plans')
    .select('*')
    .order('date', { ascending: false })
    .limit(5);

  if (mealPlansError) {
    if (mealPlansError.code === 'PGRST200' || mealPlansError.message.includes('does not exist')) {
      console.log('ℹ️ Table does not exist (may use localStorage instead)');
    } else {
      console.log('❌ Error:', mealPlansError.message);
    }
  } else {
    console.log(`ℹ️ Found ${mealPlans?.length || 0} meal plan entries`);
  }

  // 5. Check ingredients table
  console.log('\n🥗 INGREDIENTS TABLE:');
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('id')
    .limit(1);

  if (ingredientsError) {
    console.log('❌ Error:', ingredientsError.message);
    issues.push('Ingredients table query failed');
  } else {
    const { count } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ ${count} ingredients in database`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY:');
  
  if (issues.length === 0) {
    console.log('✅ All checks passed!');
  } else {
    console.log(`⚠️ Found ${issues.length} issue(s):\n`);
    issues.forEach((issue, i) => {
      console.log(`   ${i+1}. ${issue}`);
    });
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    if (issues.some(i => i.includes('empty'))) {
      console.log('   Run: npm run db:seed (or run seed.sql in Supabase dashboard)');
    }
    if (issues.some(i => i.includes('household_id'))) {
      console.log('   Run: SELECT migrate_user_to_household(user_id) in SQL editor');
    }
  }
  
  console.log('\n');
}

runDiagnostics().catch(console.error);
