'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';
import { saveJobChecklist, JobApiError } from '@/lib/job-api-client';

const DEFAULT_ITEMS = [
  { id: 'cornersCleaned', description: 'All corners cleaned', completed: false, icon: 'broom' },
  { id: 'wasteDisposed', description: 'Waste properly disposed', completed: false, icon: 'trash-alt' },
  { id: 'areaRaked', description: 'Area raked and smoothed', completed: false, icon: 'leaf' },
  { id: 'gateClosed', description: 'Gate closed and secured', completed: false, icon: 'door-closed' },
];

function itemsFromInitial(initialChecklist) {
  const source = initialChecklist?.items && typeof initialChecklist.items === 'object'
    ? initialChecklist.items
    : initialChecklist;
  return DEFAULT_ITEMS.map((item) => ({
    ...item,
    completed: Boolean(source?.[item.id]),
  }));
}

export function ServiceChecklist({ serviceId, initialChecklist, onComplete }) {
  const [checklist, setChecklist] = useState(() => itemsFromInitial(initialChecklist));
  const [notes, setNotes] = useState(initialChecklist?.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialChecklist) {
      setChecklist(itemsFromInitial(initialChecklist));
      if (typeof initialChecklist.notes === 'string') setNotes(initialChecklist.notes);
    }
  }, [initialChecklist]);

  useEffect(() => {
    onComplete?.(checklist.every((item) => item.completed));
  }, [checklist, onComplete]);

  const toggleItem = (id) => {
    setChecklist((prev) => prev.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = checklist.reduce((acc, item) => ({ ...acc, [item.id]: item.completed }), {});
      await saveJobChecklist(serviceId, payload, notes);
      toast.success('Checklist saved successfully');
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error(error instanceof JobApiError ? error.message : 'Failed to save checklist');
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
              type="button"
              onClick={() => toggleItem(item.id)}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-300'
              }`}
            >
              {item.completed && <FontAwesomeIcon icon={['fas', 'check']} className="w-4 h-4" />}
            </button>
            <FontAwesomeIcon icon={['fas', item.icon]} className="w-5 h-5 text-gray-500" />
            <span className="flex-1">{item.description}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <FontAwesomeIcon icon={['fas', 'sticky-note']} className="mr-2" />
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

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <FontAwesomeIcon icon={['fas', 'clipboard-check']} className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save Checklist'}
      </Button>
    </div>
  );
}
