'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleTestConnection() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to database');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupDatabase() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to set up database');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={handleTestConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Database Connection
        </button>

        <button 
          onClick={handleSetupDatabase}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          Setup Database Tables
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>Operation successful!</p>
          {result.timestamp && (
            <p>Current timestamp: {new Date(result.timestamp).toLocaleString()}</p>
          )}
          {result.message && (
            <p>{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
} 