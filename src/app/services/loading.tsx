import { Skeleton } from "@/components/ui/Skeleton"

export default function ServicesLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <main>
        {/* Hero Section Skeleton */}
        <section className="relative py-16 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
          </div>
        </section>

        {/* Service Details Skeleton */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div className="space-y-8">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-3/4" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-12 w-32" />
              </div>
              <Skeleton className="h-[400px] rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Service Benefits Skeleton */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Skeleton className="h-10 w-1/2 mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section Skeleton */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark px-6 py-16 sm:p-16">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <Skeleton className="h-10 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 