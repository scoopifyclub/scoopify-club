'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toast } from 'sonner';

export function ServiceChecklist({ serviceId, initialChecklist, onComplete }) {
    const [checklist, setChecklist] = useState([
        { id: 'cornersCleaned', description: 'All corners cleaned', completed: false, icon: 'broom' },
        { id: 'wasteDisposed', description: 'Waste properly disposed', completed: false, icon: 'trash-alt' },
        { id: 'areaRaked', description: 'Area raked and smoothed', completed: false, icon: 'leaf' },
        { id: 'gateClosed', description: 'Gate closed and secured', completed: false, icon: 'door-closed' },
    ]);
    const [notes, setNotes] = useState(initialChecklist?.notes || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialChecklist) {
            setChecklist(prev => prev.map(item => ({
                ...item,
                completed: initialChecklist[item.id] || false,
            })));
        }
    }, [initialChecklist]);

    useEffect(() => {
        const isComplete = checklist.every(item => item.completed);
        onComplete(isComplete);
    }, [checklist, onComplete]);

    const toggleItem = (id) => {
        setChecklist(prev => prev.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/services/${id}/checklist`, {
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

            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
            >
                <FontAwesomeIcon icon={['fas', 'clipboard-check']} className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Checklist'}
            </Button>
        </div>
    );
}
