import { Suspense } from "react";
import { Metadata } from "next";
import PaymentBatchList from "@/components/admin/payments/PaymentBatchList";
import CreateBatchForm from "@/components/admin/payments/CreateBatchForm";
import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Batches | Admin Dashboard",
  description: "Manage payment batches for employee earnings and referrals",
};

export default function PaymentBatchesPage() {
  return (
    <div className="container py-6">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/admin/payments">Payments</BreadcrumbItem>
        <BreadcrumbItem>Batches</BreadcrumbItem>
      </Breadcrumbs>

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
            <Suspense fallback={<div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
              <PaymentBatchList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 