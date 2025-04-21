import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  href: string
  label: string
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(
  ({ className, items, separator = <ChevronRight className="h-4 w-4" />, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
          className
        )}
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <React.Fragment key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "hover:text-foreground transition-colors",
                  isLast && "text-foreground font-medium pointer-events-none"
                )}
              >
                {item.label}
              </Link>
              {!isLast && separator}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
Breadcrumbs.displayName = "Breadcrumbs"

export { Breadcrumbs } 