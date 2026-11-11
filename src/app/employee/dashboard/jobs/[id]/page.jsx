'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Old JobPool "View Details" URL — send scoopers to the real job page. */
export default function LegacyJobDetailsRedirect() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id;

  useEffect(() => {
    if (!jobId) {
      router.replace('/employee/dashboard/jobs');
      return;
    }
    router.replace(`/employee/services/${jobId}`);
  }, [jobId, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-700">
      Opening job details…
    </div>
  );
}
