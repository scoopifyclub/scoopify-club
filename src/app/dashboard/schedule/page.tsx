'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [serviceType, setServiceType] = useState('regular')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Schedule Service</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={serviceType}
                onValueChange={setServiceType}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="regular" />
                  <Label htmlFor="regular">Regular Weekly Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-time" id="one-time" />
                  <Label htmlFor="one-time">One-Time Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extra" id="extra" />
                  <Label htmlFor="extra">Extra Service</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label>Time Slot</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">9:00 AM</Button>
                  <Button variant="outline">11:00 AM</Button>
                  <Button variant="outline">1:00 PM</Button>
                  <Button variant="outline">3:00 PM</Button>
                </div>
              </div>

              <Button className="w-full">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 