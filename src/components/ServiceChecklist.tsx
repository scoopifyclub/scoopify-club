'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Check, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
}

interface ServiceChecklistProps {
  serviceId: string;
  initialChecklist?: {
    cornersCleaned: boolean;
    wasteDisposed: boolean;
    areaRaked: boolean;
    gateClosed: boolean;
    notes?: string;
  };
  onComplete: (complete: boolean) => void;
}

export function ServiceChecklist({ serviceId, initialChecklist, onComplete }: ServiceChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'cornersCleaned', description: 'All corners cleaned', completed: false },
    { id: 'wasteDisposed', description: 'Waste properly disposed', completed: false },
    { id: 'areaRaked', description: 'Area raked and smoothed', completed: false },
    { id: 'gateClosed', description: 'Gate closed and secured', completed: false },
  ]);
  const [notes, setNotes] = useState(initialChecklist?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialChecklist) {
      setChecklist(prev => prev.map(item => ({
        ...item,
        completed: initialChecklist[item.id as keyof typeof initialChecklist] || false,
      })));
    }
  }, [initialChecklist]);

  useEffect(() => {
    const isComplete = checklist.every(item => item.completed);
    onComplete(isComplete);
  }, [checklist, onComplete]);

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/services/${serviceId}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist: checklist.reduce((acc, item) => ({
            ...acc,
            [item.id]: item.completed,
          }), {}),
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to save checklist');
      toast.success('Checklist saved successfully');
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-300'
              }`}
            >
              {item.completed && <Check className="w-4 h-4" />}
            </button>
            <span className="flex-1">{item.description}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Add any additional notes about the service..."
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        <ClipboardCheck className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Checklist'}
      </Button>
    </div>
  );
} 