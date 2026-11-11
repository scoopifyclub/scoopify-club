'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployeeMessagesPage() {
    return (
        <div className="p-6 max-w-xl mx-auto">
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h1 className="text-2xl font-bold">Messages</h1>
                    <p className="text-gray-700">
                        Scoopers cannot message customers. If a yard needs a note or something looks wrong,
                        contact Scoopify admin/support — we handle customer email and updates.
                    </p>
                    <p className="text-sm text-gray-600">
                        Support: <a className="underline" href="mailto:services@scoopify.club">services@scoopify.club</a>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href="/employee/faq">Help / FAQ</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/employee/dashboard">Back to jobs</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
