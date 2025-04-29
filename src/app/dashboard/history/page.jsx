'use client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
const services = [
    {
        id: 1,
        date: '2024-03-15',
        time: '9:00 AM - 11:00 AM',
        address: '123 Main St, Anytown',
        status: 'completed',
        type: 'Regular Weekly Service'
    },
    {
        id: 2,
        date: '2024-03-08',
        time: '9:00 AM - 11:00 AM',
        address: '123 Main St, Anytown',
        status: 'completed',
        type: 'Regular Weekly Service'
    },
    {
        id: 3,
        date: '2024-03-01',
        time: '9:00 AM - 11:00 AM',
        address: '123 Main St, Anytown',
        status: 'completed',
        type: 'Regular Weekly Service'
    },
    {
        id: 4,
        date: '2024-02-23',
        time: '9:00 AM - 11:00 AM',
        address: '123 Main St, Anytown',
        status: 'cancelled',
        type: 'Regular Weekly Service'
    }
];
export default function HistoryPage() {
    return (<DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Service History</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Past Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (<div key={service.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground"/>
                      <span className="font-medium">{service.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground"/>
                      <span className="text-sm text-muted-foreground">
                        {service.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground"/>
                      <span className="text-sm text-muted-foreground">
                        {service.address}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {service.type}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {service.status === 'completed' ? (<CheckCircle2 className="h-5 w-5 text-green-500"/>) : (<XCircle className="h-5 w-5 text-red-500"/>)}
                    <span className="text-sm font-medium capitalize">
                      {service.status}
                    </span>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
