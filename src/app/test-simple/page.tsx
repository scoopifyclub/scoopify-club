'use client';

import { useState } from 'react';

export default function TestSimplePage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Very Simple Test Page</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
      <hr style={{ margin: '20px 0' }} />
      <a href="/">Go Home</a>
    </div>
  );
} 