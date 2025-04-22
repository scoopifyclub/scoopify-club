"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { BreadcrumbItem, Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Clock, Play, Edit, Trash2, PlusCircle, Check, X } from "lucide-react";
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

interface BatchDetailPageProps {
  params: {
    batchId: string;
  };
}

export default function BatchDetailPage({ params }: BatchDetailPageProps) {
  const [batch, setBatch] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPayments, setIsAddingPayments] = useState(false);
  const [selectedPaymentsToAdd, setSelectedPaymentsToAdd] = useState([]);
  const [availablePayments, setAvailablePayments] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { batchId } = params;

  const fetchBatchData = async () => {
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

  const fetchAvailablePayments = async () => {
    try {
      // Fetch approved payments that aren't in any batch
      const response = await fetch("/api/admin/payments?status=APPROVED&batchId=null");
      if (!response.ok) {
        throw new Error("Failed to fetch available payments");
      }
      const data = await response.json();
      setAvailablePayments(data.payments || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [batchId]);

  const handleAddPayments = async () => {
    if (selectedPaymentsToAdd.length === 0) {
      toast({
        title: "No payments selected",
        description: "Please select at least one payment to add to the batch",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/payments/batch/${batchId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds: selectedPaymentsToAdd,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add payments to batch");
      }

      const result = await response.json();

      toast({
        title: "Payments added",
        description: `Successfully added ${result.count} payments to the batch`,
      });

      // Reset state and refresh data
      setIsAddingPayments(false);
      setSelectedPaymentsToAdd([]);
      fetchBatchData();
    } catch (error) {
      toast({
        title: "Error adding payments",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemovePayment = async (paymentId) => {
    try {
      const response = await fetch(`/api/admin/payments/batch/${batchId}/payments`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds: [paymentId],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove payment from batch");
      }

      toast({
        title: "Payment removed",
        description: "Payment has been removed from the batch",
      });

      // Refresh data
      fetchBatchData();
    } catch (error) {
      toast({
        title: "Error removing payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBatch = async () => {
    try {
      const response = await fetch(`/api/admin/payments/batch/${batchId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete batch");
      }

      toast({
        title: "Batch deleted",
        description: "The payment batch has been deleted",
      });

      // Redirect to batch list
      router.push("/admin/payments/batches");
    } catch (error) {
      toast({
        title: "Error deleting batch",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const togglePaymentSelection = (paymentId) => {
    setSelectedPaymentsToAdd((prev) =>
      prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId]
    );
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

  // Determine if batch is editable
  const isEditable = batch.status === "DRAFT";

  return (
    <div className="container py-6">
      <Breadcrumbs className="mb-6">
        <BreadcrumbItem href="/admin">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/admin/payments">Payments</BreadcrumbItem>
        <BreadcrumbItem href="/admin/payments/batches">Batches</BreadcrumbItem>
        <BreadcrumbItem>{batch.name}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="grid gap-6">
        {/* Batch Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{batch.name}</CardTitle>
                <CardDescription>
                  {batch.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge className={statusColors[batch.status] || "bg-gray-500"}>
                {batch.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Payments</div>
                <div className="text-2xl font-bold">{batch.paymentsCount || 0}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(batch.totalAmount || 0)}</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">Created</div>
                <div className="text-lg font-medium">
                  {format(new Date(batch.createdAt), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">
                  by {batch.createdBy?.name || "Admin"}
                </div>
              </div>
            </div>

            {/* Batch timeline */}
            {(batch.processingStartedAt || batch.completedAt) && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-muted-foreground mr-2">Created:</span>
                    <span>{format(new Date(batch.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  
                  {batch.processingStartedAt && (
                    <div className="flex items-center text-sm">
                      <Play className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-muted-foreground mr-2">Processing started:</span>
                      <span>
                        {format(new Date(batch.processingStartedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
                  
                  {batch.completedAt && (
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-muted-foreground mr-2">Completed:</span>
                      <span>
                        {format(new Date(batch.completedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {batch.notes && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{batch.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              asChild
            >
              <Link href="/admin/payments/batches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Batches
              </Link>
            </Button>

            {isEditable && (
              <>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link href={`/admin/payments/batches/${batchId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Batch
                  </Link>
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Batch
                </Button>
              </>
            )}

            {batch.status === "DRAFT" && batch.paymentsCount > 0 && (
              <Button
                asChild
                className="ml-auto"
              >
                <Link href={`/admin/payments/batches/${batchId}/process`}>
                  <Play className="h-4 w-4 mr-2" />
                  Process Batch
                </Link>
              </Button>
            )}
            
            {batch.status === "FAILED" && (
              <Button
                variant="destructive"
                asChild
                className="ml-auto"
              >
                <Link href={`/admin/payments/batches/${batchId}/process`}>
                  <Play className="h-4 w-4 mr-2" />
                  Retry Processing
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payments in Batch</CardTitle>
              {isEditable && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsAddingPayments(true);
                    fetchAvailablePayments();
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Payments
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isAddingPayments ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Select Payments to Add ({selectedPaymentsToAdd.length} selected)
                  </h3>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingPayments(false);
                        setSelectedPaymentsToAdd([]);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddPayments}
                      disabled={selectedPaymentsToAdd.length === 0}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Add Selected
                    </Button>
                  </div>
                </div>

                {availablePayments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No approved payments available to add to this batch.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <span className="sr-only">Select</span>
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Date Approved</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availablePayments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            className={selectedPaymentsToAdd.includes(payment.id) ? "bg-primary/5" : ""}
                            onClick={() => togglePaymentSelection(payment.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedPaymentsToAdd.includes(payment.id)}
                                onChange={() => togglePaymentSelection(payment.id)}
                                className="h-4 w-4"
                              />
                            </TableCell>
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
                              {payment.approvedAt
                                ? format(new Date(payment.approvedAt), "MMM d, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No payments in this batch</p>
                {isEditable && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingPayments(true);
                      fetchAvailablePayments();
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Payments
                  </Button>
                )}
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Payments</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="referrals">Referrals</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <PaymentTable
                    payments={payments}
                    isEditable={isEditable}
                    onRemove={handleRemovePayment}
                  />
                </TabsContent>
                
                <TabsContent value="earnings">
                  <PaymentTable
                    payments={payments.filter(p => p.type === "EARNINGS")}
                    isEditable={isEditable}
                    onRemove={handleRemovePayment}
                  />
                </TabsContent>
                
                <TabsContent value="referrals">
                  <PaymentTable
                    payments={payments.filter(p => p.type === "REFERRAL")}
                    isEditable={isEditable}
                    onRemove={handleRemovePayment}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This will remove all payments from the batch (but not delete the payments themselves).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBatch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper component for payment tables
function PaymentTable({ payments, isEditable, onRemove }) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No payments in this category</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {isEditable && <TableHead className="w-[80px]"></TableHead>}
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
              {isEditable && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(payment.id)}
                    aria-label="Remove payment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 