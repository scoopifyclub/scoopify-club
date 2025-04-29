"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { MoreVertical, Edit, Trash2, Eye, Play, AlertTriangle, } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * @typedef {Object} User
 * @property {string} name - User's name
 */

/**
 * @typedef {Object} PaymentBatch
 * @property {string} id - Unique identifier for the batch
 * @property {string} name - Name of the batch
 * @property {string} [description] - Optional description of the batch
 * @property {string} status - Status of the batch (DRAFT, PROCESSING, COMPLETED, PARTIAL, FAILED)
 * @property {string} createdAt - ISO date string when the batch was created
 * @property {User} [createdBy] - User who created the batch
 * @property {number} paymentsCount - Number of payments in the batch
 * @property {number} [totalAmount] - Total amount of all payments in the batch
 */

/**
 * @typedef {Object} Pagination
 * @property {number} total - Total number of items
 * @property {number} page - Current page number
 * @property {number} limit - Number of items per page
 * @property {number} pages - Total number of pages
 */

// Status badge colors
const statusColors = {
    DRAFT: "bg-gray-500",
    PROCESSING: "bg-blue-500 animate-pulse",
    COMPLETED: "bg-green-500",
    PARTIAL: "bg-yellow-500",
    FAILED: "bg-red-500",
};

/**
 * PaymentBatchList component for displaying and managing payment batches
 * @returns {JSX.Element} The rendered component
 */
export default function PaymentBatchList() {
    const [batches, setBatches] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState(null);
    const router = useRouter();
    const { toast } = useToast();
    const fetchBatches = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/admin/payments/batch?page=${page}&limit=${pagination.limit}`);
            if (!response.ok) {
                throw new Error("Failed to fetch batches");
            }
            const data = await response.json();
            setBatches(data.batches);
            setPagination(data.pagination);
        }
        catch (error) {
            toast({
                title: "Error fetching batches",
                description: error.message,
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchBatches();
    }, []);
    const handlePageChange = (newPage) => {
        fetchBatches(newPage);
    };
    const handleDeleteBatch = async () => {
        try {
            const response = await fetch(`/api/admin/payments/batch/${batchToDelete.id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete batch");
            }
            toast({
                title: "Batch deleted",
                description: `Batch "${batchToDelete.name}" has been deleted`,
            });
            // Refresh the list
            fetchBatches(pagination.page);
        }
        catch (error) {
            toast({
                title: "Error deleting batch",
                description: error.message,
                variant: "destructive",
            });
        }
        finally {
            setDeleteDialogOpen(false);
            setBatchToDelete(null);
        }
    };
    const confirmDelete = (batch) => {
        setBatchToDelete(batch);
        setDeleteDialogOpen(true);
    };
    const processBatch = async (batchId, paymentMethod) => {
        try {
            const response = await fetch(`/api/admin/payments/batch/${batchId}/process`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ paymentMethod }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to process batch");
            }
            const result = await response.json();
            toast({
                title: "Batch processing initiated",
                description: `Processing ${result.totalPayments} payments`,
            });
            // Refresh after a short delay to show updated status
            setTimeout(() => {
                fetchBatches(pagination.page);
            }, 500);
        }
        catch (error) {
            toast({
                title: "Error processing batch",
                description: error.message,
                variant: "destructive",
            });
        }
    };
    if (isLoading && batches.length === 0) {
        return <div className="text-center py-6">Loading batches...</div>;
    }
    if (batches.length === 0) {
        return (<div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No payment batches found</p>
        <p className="text-sm">
          Create a new batch to start managing employee and referral payments.
        </p>
      </div>);
    }
    return (<div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Payments</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => {
            var _a;
            return (<TableRow key={batch.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/payments/batches/${batch.id}`} className="hover:underline">
                    {batch.name}
                  </Link>
                  {batch.description && (<p className="text-xs text-muted-foreground mt-1">
                      {batch.description.length > 50
                        ? `${batch.description.substring(0, 50)}...`
                        : batch.description}
                    </p>)}
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[batch.status] || "bg-gray-500"}`}>
                    {batch.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(batch.createdAt), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {((_a = batch.createdBy) === null || _a === void 0 ? void 0 : _a.name) || "Admin"}
                  </div>
                </TableCell>
                <TableCell>{batch.paymentsCount}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(batch.totalAmount || 0)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open menu">
                        <MoreVertical className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/payments/batches/${batch.id}`)}>
                        <Eye className="h-4 w-4 mr-2"/>
                        View Details
                      </DropdownMenuItem>
                      
                      {batch.status === "DRAFT" && (<>
                          <DropdownMenuItem onClick={() => router.push(`/admin/payments/batches/${batch.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2"/>
                            Edit Batch
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmDelete(batch)}>
                            <Trash2 className="h-4 w-4 mr-2"/>
                            Delete Batch
                          </DropdownMenuItem>
                          
                          {batch.paymentsCount > 0 && (<DropdownMenuItem onClick={() => router.push(`/admin/payments/batches/${batch.id}/process`)}>
                              <Play className="h-4 w-4 mr-2"/>
                              Process Payments
                            </DropdownMenuItem>)}
                        </>)}
                      
                      {batch.status === "FAILED" && (<DropdownMenuItem onClick={() => router.push(`/admin/payments/batches/${batch.id}/process`)}>
                          <AlertTriangle className="h-4 w-4 mr-2"/>
                          Retry Processing
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>);
        })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (<div className="flex justify-center mt-4 gap-1">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
            Previous
          </Button>
          
          {[...Array(pagination.pages)].map((_, i) => (<Button key={i} variant={pagination.page === i + 1 ? "default" : "outline"} size="sm" onClick={() => handlePageChange(i + 1)}>
              {i + 1}
            </Button>))}
          
          <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages}>
            Next
          </Button>
        </div>)}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the batch &quot;
              {batchToDelete === null || batchToDelete === void 0 ? void 0 : batchToDelete.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
