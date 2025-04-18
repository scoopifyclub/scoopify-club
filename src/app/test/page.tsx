'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const setupTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/test/setup', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Test data created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test data');
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/test/cleanup', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      alert('Test data cleaned up successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clean up test data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Workflow</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Step 1: Setup Test Data</h2>
          <p className="mb-4">Create a test customer with subscription and scheduled service.</p>
          <div className="space-x-2">
            <Button onClick={setupTestData} disabled={loading}>
              {loading ? 'Creating...' : 'Create Test Data'}
            </Button>
            <Button onClick={cleanupTestData} disabled={loading} variant="destructive">
              {loading ? 'Cleaning...' : 'Cleanup Test Data'}
            </Button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Step 2: Test Employee Workflow</h2>
          <p className="mb-4">Use these test accounts:</p>
          <div className="space-y-2">
            <p><strong>Employee:</strong> employee@scoopify.com / test123</p>
            <p><strong>Customer:</strong> testcustomer@scoopify.com / test123</p>
          </div>
          <div className="mt-4 space-x-2">
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
            <Button onClick={() => router.push('/employee')}>Go to Employee Dashboard</Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Testing Steps</h2>
          <ol className="list-decimal pl-4 space-y-2">
            <li>Log in as employee (employee@scoopify.com)</li>
            <li>Check available jobs in employee dashboard</li>
            <li>Claim the test job</li>
            <li>Upload photos and complete the job</li>
            <li>Log in as customer (testcustomer@scoopify.com)</li>
            <li>Verify job completion and photos</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 