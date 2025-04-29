export default function MarketingLoading() {
    return (
        <div className="p-6 space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            
            {/* Marketing Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
                        <div className="h-48 bg-gray-200 animate-pulse rounded-lg mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-8 w-1/3 bg-gray-200 animate-pulse rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Order History Section */}
            <div className="mt-8">
                <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
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
        </div>
    );
} 