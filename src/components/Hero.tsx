import { Button } from '@/components/ui/button'
import { PawPrint, Sparkles, Shield } from 'lucide-react'

const features = [
  {
    name: 'Professional Service',
    description: 'Trained and vetted professionals who care about your yard',
    icon: Shield,
  },
  {
    name: 'Regular Cleanups',
    description: 'Consistent service on your preferred schedule',
    icon: PawPrint,
  },
  {
    name: 'Peace of Mind',
    description: 'Enjoy a clean yard without the hassle',
    icon: Sparkles,
  },
]

export function Hero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(142,191,71,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-primary/5" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-brand-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 5 + 5}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
          <main className="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="animate-fade-in bg-gradient-to-r from-white via-brand-primary to-white bg-clip-text text-transparent">
                <span className="block text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Professional Dog Waste
                </span>
                <span className="block text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Removal Service
                </span>
              </h1>
              <p className="mt-6 text-lg text-neutral-300 sm:mx-auto sm:mt-8 sm:max-w-xl sm:text-xl md:mt-8 md:text-2xl lg:mx-0">
                Keep your yard clean and your family safe with our reliable and professional dog waste removal service. Join the Scoopify Club today!
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-brand-primary to-brand-primary-dark px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/20"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-dark to-brand-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="group relative overflow-hidden rounded-lg border-2 border-brand-primary/30 bg-transparent px-8 py-3 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary/10"
                >
                  <span className="relative z-10">View Pricing</span>
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <div className="relative bg-gradient-to-b from-transparent via-neutral-900/50 to-neutral-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative overflow-hidden rounded-2xl bg-neutral-900/50 p-8 backdrop-blur-lg transition-all duration-500 hover:bg-neutral-900/70 hover:shadow-2xl hover:shadow-brand-primary/10"
                style={{
                  animationDelay: `${index * 100}ms`,
                  transform: 'translateY(20px)',
                  opacity: 0,
                  animation: 'slideUp 0.5s ease-out forwards',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-2 text-white shadow-lg">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {feature.name}
                  </h3>
                  <p className="text-neutral-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 