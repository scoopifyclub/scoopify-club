'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { CloudRain } from 'lucide-react';

interface WeatherDelayButtonProps {
  serviceId: string;
  onDelay: () => void;
}

export default function WeatherDelayButton({ serviceId, onDelay }: WeatherDelayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleWeatherDelay = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/services/weather-delay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId }),
      });

      if (response.ok) {
        onDelay();
      }
    } catch (error) {
      console.error('Error reporting weather delay:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleWeatherDelay}
      disabled={loading}
      variant="outline"
      className="flex items-center gap-2"
    >
      <CloudRain className="h-4 w-4" />
      {loading ? 'Reporting Delay...' : 'Report Weather Delay'}
    </Button>
  );
} 