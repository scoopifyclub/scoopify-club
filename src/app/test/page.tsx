'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
      <h1 className="text-2xl font-bold">Interactivity Test Page</h1>
      
      <div className="p-4 border rounded-lg bg-white">
        <p className="text-lg mb-4">Count: {count}</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={() => setCount(count + 1)}
        >
          Increment Count
        </button>
      </div>
      
      <div className="p-4 border rounded-lg bg-white">
        <p className="text-lg mb-2">Navigation Test:</p>
        <div className="flex gap-4">
          <Link 
            href="/"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Go Home
          </Link>
          <a 
            href="https://google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Open Google
          </a>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        If you can click the buttons and links on this page, then interactivity works,
        and the issue is elsewhere in the application.
      </p>
    </div>
  );
} 