'use client';

import { useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { swaggerConfig } from '@/lib/swagger';

export default function APIDocs() {
  useEffect(() => {
    // Add custom styles
    const style = document.createElement('style');
    style.textContent = `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { padding: 15px 0; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      <div className="bg-white rounded-lg shadow-lg p-4">
        <SwaggerUI spec={swaggerConfig} />
      </div>
    </div>
  );
} 