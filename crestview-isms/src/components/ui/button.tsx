import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-85 disabled:saturate-100",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-blue-soft hover:bg-primary/90",
        secondary: "border-2 border-[var(--portal-border)] bg-[var(--portal-control)] text-[var(--portal-text)] shadow-[0_14px_26px_-20px_rgba(7,55,127,0.72)] hover:border-[#174ea6] hover:bg-[var(--portal-control-strong)] hover:text-[var(--portal-text)] dark:shadow-none",
        ghost: "font-black text-[var(--portal-text)] hover:bg-[var(--portal-control)] hover:text-[var(--portal-text)]",
        danger: "bg-danger text-white hover:bg-danger/90"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        icon: "size-10 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
