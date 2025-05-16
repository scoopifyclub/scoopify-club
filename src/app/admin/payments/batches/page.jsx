import { Suspense } from "react";
import PaymentBatchList from "@/components/admin/payments/PaymentBatchList";
import CreateBatchForm from "@/components/admin/payments/CreateBatchForm";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";

export const metadata = {
    title: "Payment Batches | Admin Dashboard",
    description: "Manage payment batches for employee earnings and referrals",
};

export default function PaymentBatchesPage() {
    return (
        <div className="container py-6">
            <Breadcrumbs className="mb-6" items={[
                { href: "/admin", label: "Dashboard" },
                { href: "/admin/payments", label: "Payments" },
                { href: "/admin/payments/batches", label: "Batches" }
            ]} />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Batches</CardTitle>
                        <CardDescription>
                            Manage and process batches of payments for employee earnings and referrals
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateBatchForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Batch List</CardTitle>
                        <CardDescription>
                            View and manage your payment batches
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<LoadingState message="Loading payment batches..." />}>
                            <PaymentBatchList />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
