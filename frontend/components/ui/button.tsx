import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }


export const PrimaryButton = ({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      className="text-center font-semibold rounded-lg focus:ring-blue-200 focus:none focus:outline-none hover:opacity-90 disabled:opacity-80 disabled:hover:opacity-80 relative overflow-hidden h-[32px] text-sm px-3 py-1.5 mr-4 "
    >
      <div className="absolute inset-0 bg-blue-500 opacity-[16%]"></div>
      <div className="flex flex-row items-center justify-center gap-4">
        <p className="text-blue-500">{children}</p>
      </div>
    </button>
  );
};

export const SuccessButton = ({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      className="text-center font-semibold rounded-lg focus:ring-green-200 focus:none focus:outline-none hover:opacity-90 disabled:opacity-80 disabled:hover:opacity-80 relative overflow-hidden h-[32px] text-sm px-3 py-1.5 mr-4 "
    >
      <div className="absolute inset-0 bg-green-500 opacity-[16%]"></div>
      <div className="flex flex-row items-center justify-center gap-4">
        <p className="text-green-500">{children}</p>
      </div>
    </button>
  );
}; 


export const FailureButton = ({
  children,
  onClick,
}: {
  children: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      className="text-center font-semibold rounded-lg focus:ring-red-200 focus:none focus:outline-none hover:opacity-90 disabled:opacity-80 disabled:hover:opacity-80 relative overflow-hidden h-[32px] text-sm px-3 py-1.5 mr-4 "
    >
      <div className="absolute inset-0 bg-red-500 opacity-[16%]"></div>
      <div className="flex flex-row items-center justify-center gap-4">
        <p className="text-red-500">{children}</p>
      </div>
    </button>
  );
}; 
