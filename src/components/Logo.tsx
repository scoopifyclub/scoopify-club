import { Poppins } from 'next/font/google'

const poppins = Poppins({ 
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon */}
      <div className="relative w-12 h-12">
        {/* Main bag shape - more Shopify-like */}
        <div className="absolute inset-0 bg-primary-600 rounded-lg transform rotate-12">
          {/* Bag handle */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-primary-600 rounded-full" />
          {/* Dog ear - more subtle */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full" />
          {/* S letter - more prominent */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-2xl tracking-tight">S</span>
          </div>
          {/* Paw prints - more subtle */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Text - more Shopify-like */}
      <div className={`${poppins.variable} font-sans`}>
        <span className="text-3xl font-semibold text-foreground tracking-tight">Scoopify</span>
        <span className="text-xl font-normal text-accent-500 ml-1.5 tracking-tight">Club</span>
      </div>
    </div>
  )
} 