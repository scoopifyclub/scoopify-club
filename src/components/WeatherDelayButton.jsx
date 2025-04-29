'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { CloudRain } from 'lucide-react';

/**
 * @typedef {Object} WeatherDelayButtonProps
 * @property {string} serviceId - The ID of the service
 * @property {Function} onDelay - Callback function when delay is reported
 */

/**
 * WeatherDelayButton component for reporting weather delays
 * @param {WeatherDelayButtonProps} props - Component props
 * @returns {JSX.Element} The rendered component
 */
export default function WeatherDelayButton({ serviceId, onDelay }) {
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
        }
        catch (error) {
            console.error('Error reporting weather delay:', error);
        }
        finally {
            setLoading(false);
        }
    };
    return (<Button onClick={handleWeatherDelay} disabled={loading} variant="outline" className="flex items-center gap-2">
      <CloudRain className="h-4 w-4"/>
      {loading ? 'Reporting Delay...' : 'Report Weather Delay'}
    </Button>);
}
