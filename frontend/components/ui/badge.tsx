import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary/15 text-primary ring-1 ring-primary/30",
      secondary: "bg-secondary/15 text-violet-200 ring-1 ring-secondary/30",
      outline: "text-foreground ring-1 ring-border",
      pink: "bg-accent/15 text-pink-200 ring-1 ring-accent/30",
      success: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30"
    }
  },
  defaultVariants: { variant: "default" }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
