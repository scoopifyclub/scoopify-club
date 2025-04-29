import { Suspense } from "react";
import BatchProcessClient from "./BatchProcessClient";
export default function ProcessBatchPage(props) {
    // Extract batchId from props
    const { batchId } = props.params;
    return (<Suspense fallback={<div className="container py-6">Loading...</div>}>
      <BatchProcessClient batchId={batchId}/>
    </Suspense>);
}
