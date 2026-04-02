"use client"

import { Stats } from "@/lib/types"

interface ProgressChartProps {
  stats: Stats
}

export function ProgressChart({ stats }: ProgressChartProps) {
  const percentage = stats.totalCredits > 0 
    ? (stats.completedCredits / stats.totalCredits) * 100 
    : 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Degree Progress</h3>
        <span className="text-2xl font-semibold text-foreground">
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <span>{stats.completedCredits.toFixed(1)} completed</span>
        <span>{stats.pendingCredits.toFixed(1)} remaining</span>
      </div>
    </div>
  )
}
