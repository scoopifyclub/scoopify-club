import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

/**
 * @typedef {Object} LabelProps
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Label component
 * @param {LabelProps} props - Component props
 * @param {React.Ref<HTMLLabelElement>} ref - Forwarded ref
 * @returns {JSX.Element} The rendered component
 */
const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
