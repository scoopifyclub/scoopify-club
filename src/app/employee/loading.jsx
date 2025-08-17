export default function EmployeeLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-600">Loading employee dashboard...</p>
            </div>
        </div>
    );
} 