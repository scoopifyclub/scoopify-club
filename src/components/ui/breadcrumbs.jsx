import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} href - The URL of the breadcrumb item
 * @property {string} label - The label of the breadcrumb item
 */

/**
 * @typedef {Object} BreadcrumbsProps
 * @property {BreadcrumbItem[]} items - Array of breadcrumb items
 * @property {React.ReactNode} [separator] - Optional separator between breadcrumb items
 * @property {string} [className] - Additional CSS classes to apply
 */

/**
 * Breadcrumbs component for displaying navigation breadcrumbs
 * @type {React.ForwardRefExoticComponent<BreadcrumbsProps & React.RefAttributes<HTMLDivElement>>}
 */
const Breadcrumbs = React.forwardRef(
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
          const isLast = index === items.length - 1;
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
          );
        })}
      </div>
    );
  }
);
Breadcrumbs.displayName = "Breadcrumbs";

/**
 * @typedef {Object} BreadcrumbItemProps
 * @property {string} [href] - Optional URL for the breadcrumb item
 * @property {React.ReactNode} children - The content of the breadcrumb item
 * @property {string} [className] - Additional CSS classes to apply
 */

/**
 * BreadcrumbItem component for individual breadcrumb items
 * @type {React.ForwardRefExoticComponent<BreadcrumbItemProps & React.RefAttributes<HTMLLIElement>>}
 */
const BreadcrumbItem = React.forwardRef(
  ({ className, href, children, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn("inline-flex items-center", className)}
        {...props}
      >
        {href ? (
          <Link href={href} className="hover:text-foreground transition-colors">
            {children}
          </Link>
        ) : (
          <span className="text-foreground font-medium">{children}</span>
        )}
      </li>
    );
  }
);
BreadcrumbItem.displayName = "BreadcrumbItem";

export { Breadcrumbs, BreadcrumbItem };
