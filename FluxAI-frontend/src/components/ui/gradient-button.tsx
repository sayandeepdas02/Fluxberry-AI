import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-none relative overflow-hidden group hover:shadow-none transition-all cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background border border-foreground/10",
        ai: "bg-primary text-primary-foreground border border-line shadow-none",
        outline: "border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-none px-3",
        lg: "h-11 rounded-none px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "ai",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <Slot
          className={cn(gradientButtonVariants({ variant, size, className }))}
          ref={ref as any}
          {...props}
        >
          {React.cloneElement(children as React.ReactElement<any>, {
            children: (
              <>
                {variant === "ai" && (
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {(children as React.ReactElement<any>).props.children}
                </span>
              </>
            ),
          })}
        </Slot>
      )
    }

    return (
      <button
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {variant === "ai" && (
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }
