import { Suspense } from "react";
import BatchProcessClient from "./BatchProcessClient";

interface ProcessBatchPageProps {
  params: {
    batchId: string;
  };
}

export default function ProcessBatchPage({ params }: ProcessBatchPageProps) {
  return (
    <Suspense fallback={<div className="container py-6">Loading...</div>}>
      <BatchProcessClient batchId={params.batchId} />
    </Suspense>
  );
} 