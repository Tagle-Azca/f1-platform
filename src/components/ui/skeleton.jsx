import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse motion-reduce:animate-none rounded-md bg-white/[0.06]", className)}
      {...props} />
  );
}

export { Skeleton }
