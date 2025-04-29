import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * @typedef {Object} CardProps
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Card component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const Card = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  );
});
Card.displayName = "Card";

/**
 * CardHeader component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

/**
 * CardTitle component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLHeadingElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

/**
 * CardDescription component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLParagraphElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

/**
 * CardContent component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

/**
 * CardFooter component
 * @param {CardProps} props - Component props
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
