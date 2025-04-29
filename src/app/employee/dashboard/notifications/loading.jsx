export default function NotificationsLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                        <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
} 