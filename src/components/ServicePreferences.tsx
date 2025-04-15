'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Check, Calendar, Key, AlertCircle } from 'lucide-react'

interface ServicePreferencesProps {
  customerId: string
  initialPreferences?: {
    preferredDay: string
    gateCode?: string
    specialInstructions?: string
    accessNotes?: string
  }
}

export function ServicePreferences({ customerId, initialPreferences }: ServicePreferencesProps) {
  const [preferences, setPreferences] = useState({
    preferredDay: initialPreferences?.preferredDay || 'Monday',
    gateCode: initialPreferences?.gateCode || '',
    specialInstructions: initialPreferences?.specialInstructions || '',
    accessNotes: initialPreferences?.accessNotes || '',
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/customers/${customerId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast.success('Service preferences updated successfully')
    } catch (error) {
      toast.error('Failed to save preferences')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Service Preferences</h3>
        <p className="text-sm text-neutral-600">
          Set your preferred service day and provide any special instructions
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Preferred Service Day
          </label>
          <select
            value={preferences.preferredDay}
            onChange={(e) => setPreferences({ ...preferences, preferredDay: e.target.value })}
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
          >
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Gate Code (if applicable)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              value={preferences.gateCode}
              onChange={(e) => setPreferences({ ...preferences, gateCode: e.target.value })}
              className="block w-full pl-10 rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              placeholder="Enter gate code"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Special Instructions
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-neutral-400" />
            </div>
            <textarea
              value={preferences.specialInstructions}
              onChange={(e) => setPreferences({ ...preferences, specialInstructions: e.target.value })}
              className="block w-full pl-10 rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              placeholder="Any special instructions for our team"
              rows={3}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Access Notes
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-neutral-400" />
            </div>
            <textarea
              value={preferences.accessNotes}
              onChange={(e) => setPreferences({ ...preferences, accessNotes: e.target.value })}
              className="block w-full pl-10 rounded-md border-neutral-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary sm:text-sm"
              placeholder="Any additional access information"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-primary text-white hover:bg-brand-primary-dark"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
} 