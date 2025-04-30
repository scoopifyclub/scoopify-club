'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ServiceRating({ serviceId, onRatingSubmit, initialRating, readOnly = false }) {
    const [rating, setRating] = useState(initialRating || 0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = async () => {
        if (!rating) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/services/${id}/rating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit rating');
            }

            toast.success('Rating submitted successfully');
            if (onRatingSubmit) {
                onRatingSubmit(rating, comment);
            }
            setComment('');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && setRating(value)}
                        onMouseEnter={() => !readOnly && setHoveredRating(value)}
                        onMouseLeave={() => !readOnly && setHoveredRating(0)}
                        className={cn(
                            "p-1 transition-colors",
                            readOnly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"
                        )}
                    >
                        <Star
                            className={cn(
                                "h-6 w-6",
                                (hoveredRating ? value <= hoveredRating : value <= rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-gray-300"
                            )}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                    {rating ? `${rating} out of 5` : 'Rate this service'}
                </span>
            </div>

            {!readOnly && (
                <>
                    <Textarea
                        placeholder="Add a comment (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="h-24 resize-none"
                    />

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !rating}
                        className="w-full"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </Button>
                </>
            )}
        </div>
    );
} 