"use client"

import { useMemo, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Course, GRADE_MAP } from "@/lib/types"
import { ChevronDown } from "lucide-react"

interface SemesterOverviewProps {
  courses: Course[]
  semesters: string[]
  currentSemester: string
  onCurrentSemesterChange: (semester: string) => void
}

export function SemesterOverview({
  courses,
  semesters,
  currentSemester,
  onCurrentSemesterChange,
}: SemesterOverviewProps) {
  const [isOpen, setIsOpen] = useState(false)

  const semesterData = useMemo(() => {
    const buildSummary = (semester: string, semCourses: Course[]) => {
      const completed = semCourses.filter((c) => c.status === "done")
      const totalCredits = semCourses.reduce((sum, c) => sum + c.credits, 0)
      const completedCredits = completed.reduce((sum, c) => sum + c.credits, 0)
      const pendingCredits = totalCredits - completedCredits
      const progress = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0

      const gradedCourses = completed.filter((c) => c.grade && GRADE_MAP[c.grade])
      let avgGrade: number | null = null
      if (gradedCourses.length > 0) {
        const totalWeighted = gradedCourses.reduce(
          (sum, c) => sum + GRADE_MAP[c.grade!] * c.credits,
          0
        )
        const totalGradedCredits = gradedCourses.reduce((sum, c) => sum + c.credits, 0)
        avgGrade = totalWeighted / totalGradedCredits
      }

      return {
        semester,
        totalCredits,
        completedCredits,
        pendingCredits,
        progress,
        courseCount: semCourses.length,
        completedCount: completed.length,
        avgGrade,
      }
    }

    const perSemester = [...semesters].reverse().map((semester) =>
      buildSummary(semester, courses.filter((c) => c.semester === semester))
    )

    return [buildSummary("all", courses), ...perSemester]
  }, [courses, semesters])

  const currentSemesterData = semesterData.find((semester) => semester.semester === currentSemester) ?? null
  const otherSemesters = semesterData.filter((semester) => semester.semester !== currentSemester && semester.semester !== "all")

  const renderSemesterRow = (data: (typeof semesterData)[number]) => {
    return (
      <div key={data.semester} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">
            {data.semester === "all" ? "All semesters" : <span className="font-mono">{data.semester}</span>}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{data.completedCount}/{data.courseCount} courses</span>
            {data.avgGrade && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Avg: {data.avgGrade.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all"
            style={{ width: `${data.progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{data.completedCredits.toFixed(2)} / {data.totalCredits.toFixed(2)} ECTS</span>
          <span>{data.progress.toFixed(0)}%</span>
          <span>{data.pendingCredits.toFixed(2)} remaining</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-medium text-foreground">Study Progress</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={currentSemester} onValueChange={onCurrentSemesterChange}>
              <SelectTrigger className="w-[120px]" size="sm">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {otherSemesters.length > 0 && (
              <CollapsibleTrigger className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                {isOpen ? "Hide past semesters" : `Show ${otherSemesters.length} more`}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
            )}
          </div>
        </div>
        <div className="divide-y divide-border">
          {currentSemesterData ? (
            renderSemesterRow(currentSemesterData)
          ) : (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              No courses found for <span className="font-mono">{currentSemester}</span>.
            </div>
          )}
          {otherSemesters.length > 0 && (
            <CollapsibleContent className="divide-y divide-border">
              {otherSemesters.map(renderSemesterRow)}
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </div>
  )
}
