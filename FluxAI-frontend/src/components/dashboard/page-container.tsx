import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   PAGE CONTAINER — Standard page wrapper
   Consistent padding, optional max-width
   ═══════════════════════════════════════════════════ */

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthMap = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1400px]",
  full: "",
};

export function PageContainer({
  children,
  title,
  description,
  className,
  maxWidth = "xl",
}: PageContainerProps) {
  return (
    <div className={cn("px-6 py-6", className)}>
      <div className={cn(maxWidthMap[maxWidth], "mx-auto")}>
        {/* Page header */}
        {title && (
          <div className="mb-6">
            <h1 className="heading-lg">{title}</h1>
            {description && (
              <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
