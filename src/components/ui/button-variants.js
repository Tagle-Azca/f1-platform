import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 aria-invalid:border-neg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-steel text-bg hover:bg-steel-hi font-semibold",
        outline:
          "border-white/20 bg-transparent text-ink hover:bg-white/5 aria-expanded:bg-white/5",
        secondary:
          "bg-white/10 text-ink hover:bg-white/15 aria-expanded:bg-white/15",
        ghost:
          "text-ink-2 hover:bg-white/5 hover:text-ink aria-expanded:bg-white/5",
        destructive:
          "bg-neg text-bg hover:brightness-110",
        link: "text-steel underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-11 md:min-h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "min-h-8 md:min-h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-11 md:min-h-8 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-12 gap-1.5 px-5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-11 md:size-9",
        "icon-xs":
          "size-11 md:size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-11 md:size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
