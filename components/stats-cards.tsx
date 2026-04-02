"use client"

import { Stats } from "@/lib/types"
import { BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react"

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Completed Credits",
      value: stats.completedCredits.toFixed(1),
      subtext: `of ${stats.totalCredits.toFixed(1)} total`,
      icon: CheckCircle2,
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-500/10",
    },
    {
      label: "Pending Credits",
      value: stats.pendingCredits.toFixed(1),
      subtext: `${stats.pendingCourses} courses remaining`,
      icon: Clock,
      accent: "text-amber-500",
      bgAccent: "bg-amber-500/10",
    },
    {
      label: "Courses Completed",
      value: stats.completedCourses.toString(),
      subtext: `of ${stats.completedCourses + stats.pendingCourses} total`,
      icon: BookOpen,
      accent: "text-blue-500",
      bgAccent: "bg-blue-500/10",
    },
    {
      label: "Average Grade",
      value: stats.averageGrade ? stats.averageGrade.toFixed(2) : "—",
      subtext: stats.averageGrade ? "weighted by credits" : "no graded courses",
      icon: GraduationCap,
      accent: "text-violet-500",
      bgAccent: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.subtext}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${card.bgAccent}`}>
              <card.icon className={`h-5 w-5 ${card.accent}`} />
            </div>
          </div>
          <div
            className={`absolute bottom-0 left-0 h-1 w-full ${card.bgAccent} opacity-0 transition-opacity group-hover:opacity-100`}
          />
        </div>
      ))}
    </div>
  )
}
