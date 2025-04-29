'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function ServiceRatingsList({ ratings }) {
    if (!ratings?.length) {
        return (
            <div className="text-center text-gray-500 py-8">
                No ratings yet
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {ratings.map((rating) => (
                <div key={rating.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <Star
                                        key={value}
                                        className={cn(
                                            "h-4 w-4",
                                            value <= rating.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-none text-gray-300"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="font-medium">
                                {rating.customer.user.name}
                            </span>
                        </div>
                        <time className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                        </time>
                    </div>
                    {rating.comment && (
                        <p className="mt-2 text-gray-600">
                            {rating.comment}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export function ServiceRatingSummary({ ratings }) {
    if (!ratings?.length) return null;

    const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
    const ratingCounts = ratings.reduce((acc, curr) => {
        acc[curr.rating] = (acc[curr.rating] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">out of 5</span>
                </div>
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                            key={value}
                            className={cn(
                                "h-5 w-5",
                                value <= Math.round(averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-gray-300"
                            )}
                        />
                    ))}
                </div>
                <span className="text-sm text-gray-500">
                    {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
                </span>
            </div>

            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((value) => (
                    <div key={value} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-8">{value} star</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-yellow-400"
                                style={{
                                    width: `${((ratingCounts[value] || 0) / ratings.length) * 100}%`
                                }}
                            />
                        </div>
                        <span className="text-sm text-gray-500 w-8">
                            {ratingCounts[value] || 0}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
} 