import { Suspense } from "react";
import BatchProcessClient from "./BatchProcessClient";

// Define the component with direct type annotation
export default function ProcessBatchPage({ 
  params 
}: { 
  params: { batchId: string } 
}) {
  return (
    <Suspense fallback={<div className="container py-6">Loading...</div>}>
      <BatchProcessClient batchId={params.batchId} />
    </Suspense>
  );
} 