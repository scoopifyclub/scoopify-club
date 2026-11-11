'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CustomersPage() {
    return (
        <div className="p-6 max-w-xl mx-auto">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h1 className="text-2xl font-bold">Customers</h1>
                    <p className="text-gray-700">
                        Scoopers do not manage a customer directory. Yard address and gate details show on the
                        job you claim. Customer email and messaging stay with Scoopify admins.
                    </p>
                    <Button asChild>
                        <Link href="/employee/dashboard/services">Go to My Jobs</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
