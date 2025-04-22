"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Status badge colors
const statusColors = {
  DRAFT: "bg-gray-500",
  PROCESSING: "bg-blue-500 animate-pulse",
  COMPLETED: "bg-green-500",
  PARTIAL: "bg-yellow-500",
  FAILED: "bg-red-500",
};

// Payment type badge colors
const typeColors = {
  EARNINGS: "bg-green-100 text-green-800",
  REFERRAL: "bg-purple-100 text-purple-800",
  REFUND: "bg-orange-100 text-orange-800",
};

export default function BatchProcessClient({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [processingResult, setProcessingResult] = useState(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchBatch = async () => {
    setIsLoading(true);
    try {
      // Fetch batch details
      const batchResponse = await fetch(`/api/admin/payments/batch/${batchId}`);
      if (!batchResponse.ok) {
        throw new Error("Failed to fetch batch details");
      }
      const batchData = await batchResponse.json();
      setBatch(batchData);

      // Fetch payments in batch
      const paymentsResponse = await fetch(`/api/admin/payments/batch/${batchId}/payments`);
      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }
      const paymentsData = await paymentsResponse.json();
      setPayments(paymentsData.payments || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const handleProcessBatch = async () => {
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/payments/batch/${batchId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process batch");
      }

      const result = await response.json();
      setProcessingResult(result);

      toast({
        title: `Batch ${result.status.toLowerCase()}`,
        description: `Successfully processed ${result.successCount} out of ${result.totalPayments} payments`,
        variant: result.failedCount > 0 ? "destructive" : "default",
      });

      // Refresh batch data
      fetchBatch();
    } catch (error) {
      toast({
        title: "Error processing batch",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container py-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold mb-2">Batch Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested payment batch could not be found.
          </p>
          <Button asChild>
            <Link href="/admin/payments/batches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Batches
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Check if batch can be processed
  const canProcess = ["DRAFT", "FAILED"].includes(batch.status) && payments.length > 0;

  return (
    <div className="container py-6">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/admin/payments">Payments</BreadcrumbItem>
        <BreadcrumbItem href="/admin/payments/batches">Batches</BreadcrumbItem>
        <BreadcrumbItem href={`/admin/payments/batches/${batchId}`}>{batch.name}</BreadcrumbItem>
        <BreadcrumbItem>Process</BreadcrumbItem>
      </Breadcrumbs>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Process Batch: {batch.name}</CardTitle>
                <CardDescription>
                  Process payments in this batch
                </CardDescription>
              </div>
              <Badge className={statusColors[batch.status] || "bg-gray-500"}>
                {batch.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!canProcess && (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">Cannot process batch</h3>
                      <p className="text-sm mt-1">
                        {batch.status !== "DRAFT" && batch.status !== "FAILED"
                          ? "This batch has already been processed or is currently processing."
                          : "There are no payments in this batch to process."}
                      </p>
                      <div className="mt-3">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/payments/batches/${batchId}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Batch Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {canProcess && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="space-y-2 w-full max-w-xs">
                      <label className="block text-sm font-medium">
                        Payment Method
                      </label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STRIPE">Stripe</SelectItem>
                          <SelectItem value="CASH_APP">Cash App</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CHECK">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={!paymentMethod || isProcessing}
                          className="mt-2 md:mt-0"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Process Batch"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Batch Processing</AlertDialogTitle>
                          <AlertDialogDescription>
                            You are about to process {payments.length} payments using{" "}
                            <strong>{paymentMethod?.replace("_", " ")}</strong>. This action will send funds to recipients. Are you sure?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleProcessBatch}>
                            Process Payments
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {processingResult && (
                    <div className={`p-4 rounded-md ${processingResult.failedCount > 0 ? "bg-yellow-50" : "bg-green-50"}`}>
                      <div className="flex items-start">
                        {processingResult.failedCount > 0 ? (
                          <AlertCircle className="h-5 w-5 mr-2 text-yellow-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-medium">
                            Batch processing {processingResult.status.toLowerCase()}
                          </h3>
                          <p className="text-sm mt-1">
                            Successfully processed {processingResult.successCount} out of {processingResult.totalPayments} payments.
                            {processingResult.failedCount > 0 && ` ${processingResult.failedCount} payments failed.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-4">Payments to Process ({payments.length})</h3>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                <Badge variant="outline" className={typeColors[payment.type] || ""}>
                                  {payment.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {payment.type === "EARNINGS" && payment.employee ? (
                                  <div>
                                    <div>{payment.employee.user.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {payment.employee.user.email}
                                    </div>
                                  </div>
                                ) : payment.type === "REFERRAL" && payment.referral ? (
                                  <div>
                                    <div>{payment.referral.referrer.user.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {payment.referral.referrer.user.email}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Unknown</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={payment.status === "APPROVED" ? "outline" : "secondary"}>
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 