import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ServiceDaySelector({ currentDay, onChange, loading }) {
  const [selected, setSelected] = useState(currentDay);

  const handleSelect = (day) => {
    setSelected(day);
    if (onChange) onChange(day);
  };

  return (
    <Card className="mb-6 border-blue-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-800">Pick Your Service Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-gray-600">
          Your job will be released for scoopers every <span className="font-semibold text-blue-700">{selected}</span> at 7:00 AM.
        </div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(day => (
            <Button
              key={day}
              variant={selected === day ? 'default' : 'outline'}
              className={`min-w-[90px] font-semibold ${selected === day ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-200'}`}
              aria-label={`Select ${day} as service day`}
              onClick={() => handleSelect(day)}
              disabled={loading}
            >
              {day}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
