'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { calculateMemberTargets } from '@/context/HouseholdContext'
import { Users, Plus, Trash2, Save, AlertCircle, Check } from 'lucide-react'

// Phase descriptions
const PHASE_INFO = {
  1: { name: 'Phase 1', desc: 'Strictest - 70% fat, 20% protein, 10% carbs' },
  2: { name: 'Phase 2', desc: 'Transition - 55% fat, 20% protein, 25% carbs' },
  3: { name: 'Phase 3', desc: 'Maintenance - 40% fat, 20% protein, 40% carbs' },
}

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Very hard exercise, physical job' },
]

export default function SettingsView() {
  const {
    user,
    household,
    members,
    activeMember,
    isHouseholdMode,
    refreshHousehold
  } = useUser()

  const [editingMember, setEditingMember] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editingHouseholdName, setEditingHouseholdName] = useState(false)
  const [householdName, setHouseholdName] = useState('')

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    current_weight_kg: '',
    target_weight_kg: '',
    height_cm: '',
    age: '',
    sex: 'female',
    activity_level: 'sedentary',
    current_phase: 1,
    dietary_restrictions: {
      dairy_free: false,
      gluten_free: false,
      nut_free: false,
      vegetarian: false,
      vegan: false,
    }
  })

  // Handle creating a new household for existing user
  const handleCreateHousehold = async () => {
    if (!user) return
    setSaving(true)
    setError(null)

    try {
      // Create household
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert({ name: 'Our Family' })
        .select()
        .single()

      if (householdError) throw householdError

      // Create member from user profile
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdData.id,
          name: user.name,
          is_primary: true,
          current_weight_kg: user.current_weight_kg,
          target_weight_kg: user.target_weight_kg,
          height_cm: user.height_cm,
          age: new Date().getFullYear() - new Date(user.date_of_birth).getFullYear(),
          sex: user.gender,
          activity_level: user.activity_level,
          current_phase: parseInt(user.current_phase?.replace('phase', '') || '1'),
        })

      if (memberError) throw memberError

      // Link user to household
      const { error: updateError } = await supabase
        .from('users')
        .update({ household_id: householdData.id })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Users set up! You can now add more users.')
      refreshHousehold()

    } catch (err) {
      console.error('Error creating household:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle renaming household
  const handleRenameHousehold = async () => {
    if (!household || !householdName.trim()) return
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('households')
        .update({ name: householdName.trim() })
        .eq('id', household.id)

      if (error) throw error

      setSuccess('Name updated!')
      setEditingHouseholdName(false)
      refreshHousehold()

    } catch (err) {
      console.error('Error renaming household:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle adding a new member
  const handleAddMember = async () => {
    if (!household) return
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          name: newMember.name,
          is_primary: false,
          current_weight_kg: parseFloat(newMember.current_weight_kg),
          target_weight_kg: parseFloat(newMember.target_weight_kg),
          height_cm: parseFloat(newMember.height_cm),
          age: parseInt(newMember.age),
          sex: newMember.sex,
          activity_level: newMember.activity_level,
          current_phase: newMember.current_phase,
          dietary_restrictions: newMember.dietary_restrictions,
        })

      if (error) throw error

      setSuccess(`${newMember.name} added!`)
      setShowAddMember(false)
      setNewMember({
        name: '',
        current_weight_kg: '',
        target_weight_kg: '',
        height_cm: '',
        age: '',
        sex: 'female',
        activity_level: 'sedentary',
        current_phase: 1,
        dietary_restrictions: {
          dairy_free: false,
          gluten_free: false,
          nut_free: false,
          vegetarian: false,
          vegan: false,
        }
      })
      refreshHousehold()

    } catch (err) {
      console.error('Error adding member:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle updating a member
  const handleUpdateMember = async (memberId, updates) => {
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('household_members')
        .update(updates)
        .eq('id', memberId)

      if (error) throw error

      setSuccess('Profile updated!')
      setEditingMember(null)
      refreshHousehold()

    } catch (err) {
      console.error('Error updating member:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Handle removing a member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName}?`)) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setSuccess(`${memberName} removed.`)
      refreshHousehold()

    } catch (err) {
      console.error('Error removing member:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Clear messages after delay
  if (success) {
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl h-full overflow-y-auto pb-24">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Users</h1>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Users Section */}
      <section className="mb-8">
        {!isHouseholdMode ? (
          <div className="p-6 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">
              Set up users to share meal plans. Each person can have their own nutrition targets while sharing the same recipes.
            </p>
            <Button onClick={handleCreateHousehold} disabled={saving}>
              {saving ? 'Creating...' : 'Get Started'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              {/* User List */}
              <div className="space-y-3">
                {members.map(member => {
                  const targets = member.targets || calculateMemberTargets(member)

                  return (
                    <div
                      key={member.id}
                      className="p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          {member.name}
                          {member.is_primary && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMember(member)}
                          >
                            Edit
                          </Button>
                          {!member.is_primary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Phase {member.current_phase} · {targets.dailyCalories} cal/day · {targets.protein}g Protein · {targets.fat}g Fat · {targets.carbs}g Carbs
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add User Button - below user list */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMember(true)}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add User
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Add User Form */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-card border rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto overflow-x-hidden mb-20 md:mb-0"
            style={{ overscrollBehavior: 'contain' }}
          >
            <h3 className="text-lg font-semibold mb-4">Add User</h3>

            <div className="space-y-4 pb-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-background"
                  placeholder="e.g., Rhonda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Current Weight (kg)</label>
                  <input
                    type="number"
                    value={newMember.current_weight_kg}
                    onChange={e => setNewMember({ ...newMember, current_weight_kg: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    placeholder="84.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Weight (kg)</label>
                  <input
                    type="number"
                    value={newMember.target_weight_kg}
                    onChange={e => setNewMember({ ...newMember, target_weight_kg: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    placeholder="80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input
                    type="number"
                    value={newMember.height_cm}
                    onChange={e => setNewMember({ ...newMember, height_cm: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    placeholder="165"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Age</label>
                  <input
                    type="number"
                    value={newMember.age}
                    onChange={e => setNewMember({ ...newMember, age: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                    placeholder="55"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Sex</label>
                <select
                  value={newMember.sex}
                  onChange={e => setNewMember({ ...newMember, sex: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-background"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Activity Level</label>
                <select
                  value={newMember.activity_level}
                  onChange={e => setNewMember({ ...newMember, activity_level: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-lg bg-background"
                >
                  {ACTIVITY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Phase</label>
                <select
                  value={newMember.current_phase}
                  onChange={e => setNewMember({ ...newMember, current_phase: parseInt(e.target.value) })}
                  className="w-full mt-1 p-2 border rounded-lg bg-background"
                >
                  {Object.entries(PHASE_INFO).map(([phase, info]) => (
                    <option key={phase} value={phase}>
                      {info.name} - {info.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries({
                    dairy_free: 'Dairy Free',
                    gluten_free: 'Gluten Free',
                    nut_free: 'Nut Free',
                    vegetarian: 'Vegetarian',
                    vegan: 'Vegan',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={newMember.dietary_restrictions[key]}
                        onChange={e => setNewMember({
                          ...newMember,
                          dietary_restrictions: {
                            ...newMember.dietary_restrictions,
                            [key]: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={saving || !newMember.name || !newMember.current_weight_kg}
              >
                {saving ? 'Adding...' : 'Add User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <MemberEditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleUpdateMember}
          saving={saving}
        />
      )}

      {/* Phase Information */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Galveston Diet Phases</h2>
        <div className="space-y-3">
          {Object.entries(PHASE_INFO).map(([phase, info]) => (
            <div key={phase} className="p-4 border rounded-lg bg-muted/30">
              <h3 className="font-medium">{info.name}</h3>
              <p className="text-sm text-muted-foreground">{info.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Edit Member Modal Component
function MemberEditModal({ member, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    current_weight_kg: member.current_weight_kg,
    target_weight_kg: member.target_weight_kg,
    height_cm: member.height_cm,
    age: member.age,
    activity_level: member.activity_level,
    current_phase: member.current_phase,
    dietary_restrictions: member.dietary_restrictions || {},
  })

  const targets = calculateMemberTargets({ ...member, ...form })

  const handleSave = () => {
    onSave(member.id, form)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-card border rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto overflow-x-hidden mb-20 md:mb-0"
        style={{ overscrollBehavior: 'contain' }}
      >
        <h3 className="text-lg font-semibold mb-4">Edit {member.name}</h3>

        <div className="space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Current Weight (kg)</label>
              <input
                type="number"
                value={form.current_weight_kg}
                onChange={e => setForm({ ...form, current_weight_kg: parseFloat(e.target.value) })}
                className="w-full mt-1 p-2 border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target Weight (kg)</label>
              <input
                type="number"
                value={form.target_weight_kg}
                onChange={e => setForm({ ...form, target_weight_kg: parseFloat(e.target.value) })}
                className="w-full mt-1 p-2 border rounded-lg bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Height (cm)</label>
              <input
                type="number"
                value={form.height_cm}
                onChange={e => setForm({ ...form, height_cm: parseFloat(e.target.value) })}
                className="w-full mt-1 p-2 border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm({ ...form, age: parseInt(e.target.value) })}
                className="w-full mt-1 p-2 border rounded-lg bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Activity Level</label>
            <select
              value={form.activity_level}
              onChange={e => setForm({ ...form, activity_level: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg bg-background"
            >
              {ACTIVITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Phase</label>
            <select
              value={form.current_phase}
              onChange={e => setForm({ ...form, current_phase: parseInt(e.target.value) })}
              className="w-full mt-1 p-2 border rounded-lg bg-background"
            >
              {Object.entries(PHASE_INFO).map(([phase, info]) => (
                <option key={phase} value={phase}>
                  {info.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Dietary Restrictions</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries({
                dairy_free: 'Dairy Free',
                gluten_free: 'Gluten Free',
                nut_free: 'Nut Free',
                vegetarian: 'Vegetarian',
                vegan: 'Vegan',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.dietary_restrictions?.[key] || false}
                    onChange={e => setForm({
                      ...form,
                      dietary_restrictions: {
                        ...form.dietary_restrictions,
                        [key]: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Preview calculated targets */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-1">Calculated Targets:</p>
            <p className="text-sm text-muted-foreground">
              {targets.dailyCalories} cal · {targets.protein}g Protein · {targets.fat}g Fat · {targets.carbs}g Carbs
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
