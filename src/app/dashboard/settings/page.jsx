'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Phone, MapPin } from 'lucide-react';
export default function SettingsPage() {
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        serviceReminders: true,
        billingAlerts: true
    });
    return (<DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                    <User className="h-4 w-4"/>
                  </span>
                  <Input id="name" placeholder="John Doe" className="rounded-l-none"/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                    <Mail className="h-4 w-4"/>
                  </span>
                  <Input id="email" type="email" placeholder="john@example.com" className="rounded-l-none"/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                    <Phone className="h-4 w-4"/>
                  </span>
                  <Input id="phone" type="tel" placeholder="(555) 555-5555" className="rounded-l-none"/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground">
                    <MapPin className="h-4 w-4"/>
                  </span>
                  <Input id="address" placeholder="123 Main St, Anytown" className="rounded-l-none"/>
                </div>
              </div>

              <Button className="w-full">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications(Object.assign(Object.assign({}, notifications), { email: checked }))}/>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via text message
                  </p>
                </div>
                <Switch checked={notifications.sms} onCheckedChange={(checked) => setNotifications(Object.assign(Object.assign({}, notifications), { sms: checked }))}/>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Service Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders about upcoming services
                  </p>
                </div>
                <Switch checked={notifications.serviceReminders} onCheckedChange={(checked) => setNotifications(Object.assign(Object.assign({}, notifications), { serviceReminders: checked }))}/>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Billing Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about payments
                  </p>
                </div>
                <Switch checked={notifications.billingAlerts} onCheckedChange={(checked) => setNotifications(Object.assign(Object.assign({}, notifications), { billingAlerts: checked }))}/>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
