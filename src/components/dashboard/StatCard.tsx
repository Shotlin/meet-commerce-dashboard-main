import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  className?: string
}

// Simplified from bakaloo-dashboard's StatCard — dropped the recharts
// sparkline (not used by any real caller in this app yet, and pulling in
// recharts just for an unused prop isn't worth the dependency).
export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-5 bg-card border shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  )
}
