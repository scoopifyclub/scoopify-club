'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CloudRain } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function WeatherDelay({ serviceId }: { serviceId: string }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/services/${serviceId}/delay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          type: 'WEATHER',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to report delay')
      }

      const data = await response.json()
      toast.success('Delay reported successfully!')
      router.refresh()
    } catch (error) {
      console.error('Error reporting delay:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to report delay')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CloudRain className="h-5 w-5 text-neutral-500" />
        <h3 className="text-lg font-medium">Report Weather Delay</h3>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="reason"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Reason for Delay
        </label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the weather conditions preventing service..."
          required
          minLength={10}
          maxLength={500}
        />
        <p className="text-xs text-neutral-500">
          Please provide detailed information about the weather conditions
        </p>
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={loading || !reason.trim()}
      >
        {loading ? 'Submitting...' : 'Report Delay'}
      </Button>
    </div>
  )
} 