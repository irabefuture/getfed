'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/context/UserContext'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { loadShoppingList, updateCheckedItems, CATEGORY_LABELS } from '@/lib/shoppingList'
import { Printer, ShoppingCart, AlertCircle } from 'lucide-react'

export default function ShoppingListView() {
  const { user } = useUser()
  const [listData, setListData] = useState(null)
  const [checkedItems, setCheckedItems] = useState([])
  
  // Load shopping list on mount and when user changes
  useEffect(() => {
    if (user) {
      const saved = loadShoppingList(user.id)
      if (saved) {
        setListData(saved)
        setCheckedItems(saved.checkedItems || [])
      }
    }
  }, [user?.id])
  
  // Toggle item checked state
  const toggleItem = (itemKey) => {
    const newChecked = checkedItems.includes(itemKey)
      ? checkedItems.filter(k => k !== itemKey)
      : [...checkedItems, itemKey]
    
    setCheckedItems(newChecked)
    if (user) {
      updateCheckedItems(user.id, newChecked)
    }
  }
  
  // Check if all items in a category are checked
  const isCategoryComplete = (items) => {
    return items.every(item => checkedItems.includes(item.name.toLowerCase()))
  }
  
  // Count totals
  const getTotalCounts = () => {
    if (!listData?.list) return { total: 0, checked: 0 }
    
    let total = 0
    Object.values(listData.list).forEach(items => {
      total += items.length
    })
    
    return { total, checked: checkedItems.length }
  }
  
  // Handle print
  const handlePrint = () => {
    window.print()
  }
  
  // No list committed yet
  if (!listData) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold mb-4">Shopping List</h1>
        
        <div className="bg-muted/30 rounded-lg p-6 md:p-8 text-center">
          <ShoppingCart className="h-10 md:h-12 w-10 md:w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-base md:text-lg font-medium mb-2">No shopping list yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Plan your week, then commit your list when ready.
          </p>
          <Button variant="outline" size="sm">
            Go to Weekly Planner
          </Button>
        </div>
      </div>
    )
  }
  
  const { total, checked } = getTotalCounts()
  const categories = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'other']
  
  return (
    <div className="flex-1 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between mb-4 md:mb-6 print:mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Shopping List</h1>
          <p className="text-sm text-muted-foreground">
            {listData.weekLabel} · {checked}/{total} items
          </p>
        </div>
        
        <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden shrink-0">
          <Printer className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Print</span>
        </Button>
      </div>
      
      {/* Committed timestamp */}
      <div className="text-xs text-muted-foreground mb-4 print:hidden">
        Committed: {new Date(listData.committedAt).toLocaleString('en-AU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
      
      {/* Shopping List */}
      <div className="space-y-4 md:space-y-6">
        {categories.map(category => {
          const items = listData.list[category] || []
          if (items.length === 0) return null
          
          const isComplete = isCategoryComplete(items)
          
          return (
            <div key={category} className="bg-card rounded-lg border p-3 md:p-4">
              <h2 className={`font-semibold mb-2 md:mb-3 uppercase text-xs md:text-sm tracking-wide ${isComplete ? 'text-muted-foreground line-through' : ''}`}>
                {CATEGORY_LABELS[category]}
                <span className="text-muted-foreground font-normal ml-2">
                  ({items.filter(i => checkedItems.includes(i.name.toLowerCase())).length}/{items.length})
                </span>
              </h2>
              
              <div className="space-y-1 md:space-y-2">
                {items.map(item => {
                  const itemKey = item.name.toLowerCase()
                  const isChecked = checkedItems.includes(itemKey)
                  
                  return (
                    <label
                      key={itemKey}
                      className={`flex items-start gap-3 py-1.5 md:py-1 cursor-pointer min-h-[44px] md:min-h-0 ${isChecked ? 'text-muted-foreground' : ''}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(itemKey)}
                        className="print:hidden mt-0.5"
                      />
                      <div className="flex-1 print:before:content-['☐_'] print:before:mr-2">
                        <span className={`${isChecked ? 'line-through' : ''} text-sm md:text-base`}>
                          {item.name}
                        </span>
                        <span className="text-muted-foreground text-xs md:text-sm ml-2">
                          {item.grams}g
                          {item.hint && (
                            <span className="text-muted-foreground/70 ml-1 md:ml-2">
                              ({item.hint})
                            </span>
                          )}
                        </span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Pantry staples reminder */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg print:bg-white">
        <div className="flex gap-2 md:gap-3">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 text-sm md:text-base">Pantry staples not listed</h3>
            <p className="text-xs md:text-sm text-amber-700 mt-1">
              Check: olive oil, salt, pepper, and basics.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
