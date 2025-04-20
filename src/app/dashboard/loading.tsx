import { Skeleton } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section Skeleton */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Schedule Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Service Status Skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton className="h-8 w-32 mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 