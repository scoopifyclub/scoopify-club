export default function ReportsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </div>

            {/* Revenue Overview Loading */}
            <div className="rounded-lg border p-6">
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>

                <div className="w-full h-64 bg-gray-100 rounded-lg"></div>
            </div>

            {/* Service Analysis Loading */}
            <div className="rounded-lg border p-6">
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-4">
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 