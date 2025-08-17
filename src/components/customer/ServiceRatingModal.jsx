'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceRatingModal({ 
    isOpen, 
    onClose, 
    service, 
    scooper,
    onRatingSubmitted 
}) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [quickRating, setQuickRating] = useState(null); // 'good' or 'bad'

    const handleStarClick = (starRating) => {
        setRating(starRating);
        setQuickRating(null); // Clear quick rating when stars are used
    };

    const handleQuickRating = (type) => {
        setQuickRating(type);
        if (type === 'good') {
            setRating(5);
        } else {
            setRating(2);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            
            const response = await fetch('/api/customer/services/rating', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serviceId: service.id,
                    scooperId: scooper.id,
                    rating: rating,
                    feedback: feedback.trim(),
                    quickRating: quickRating
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit rating');
            }

            const data = await response.json();
            toast.success('Thank you for your feedback!');
            
            if (onRatingSubmitted) {
                onRatingSubmitted(data.rating);
            }
            
            onClose();
            
        } catch (error) {
            console.error('Error submitting rating:', error);
            toast.error('Failed to submit rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (rating > 0) {
            // Ask for confirmation if they've started rating
            if (confirm('Are you sure you want to close without submitting your rating?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        Rate Your Service
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                    {/* Service Info */}
                    <div className="text-center">
                        <h3 className="font-medium text-lg mb-2">
                            How was your service with {scooper.user?.name}?
                        </h3>
                        <p className="text-sm text-gray-600">
                            {service.servicePlan?.name} • {new Date(service.completedDate).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Quick Rating Buttons */}
                    <div className="flex justify-center space-x-4">
                        <Button
                            variant={quickRating === 'good' ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => handleQuickRating('good')}
                            className={`flex items-center space-x-2 ${
                                quickRating === 'good' ? 'bg-green-600 hover:bg-green-700' : ''
                            }`}
                        >
                            <ThumbsUp className="w-5 h-5" />
                            <span>Great!</span>
                        </Button>
                        
                        <Button
                            variant={quickRating === 'bad' ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => handleQuickRating('bad')}
                            className={`flex items-center space-x-2 ${
                                quickRating === 'bad' ? 'bg-red-600 hover:bg-red-700' : ''
                            }`}
                        >
                            <ThumbsDown className="w-5 h-5" />
                            <span>Not Great</span>
                        </Button>
                    </div>

                    {/* Star Rating */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-3">Or rate with stars:</p>
                        <div className="flex justify-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleStarClick(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-colors"
                                >
                                    <Star
                                        className={`w-8 h-8 ${
                                            star <= (hoverRating || rating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {rating > 0 && (
                                <>
                                    {rating === 1 && 'Poor'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 3 && 'Good'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 5 && 'Excellent'}
                                </>
                            )}
                        </p>
                    </div>

                    {/* Feedback Text */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional feedback (optional)
                        </label>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us about your experience..."
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {feedback.length}/500 characters
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || submitting}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating'}
                        </Button>
                    </div>

                    {/* Rating Benefits */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-700 text-center">
                            💡 Your feedback helps us improve and helps other customers choose great scoopers!
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
