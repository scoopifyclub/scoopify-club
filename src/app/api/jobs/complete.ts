import { handleCompleteRequest } from '@/lib/job-completion';

// POST: the assigned scooper completes a job ({ serviceId, checklist, notes })
export async function POST(request: Request) {
  return handleCompleteRequest(request, undefined);
}
