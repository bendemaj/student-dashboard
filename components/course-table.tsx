"use client"

import { Fragment, useState } from "react"
import { Course, GRADE_COLORS, STATUS_COLORS } from "@/lib/types"
import { ArrowUpDown, ChevronDown, ChevronUp, Calendar, User } from "lucide-react"
import { CourseActionsMenu } from "@/components/course-actions-menu"

interface CourseTableProps {
  courses: Course[]
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
}

type SortField = "name" | "credits" | "semester" | "status" | "grade"
type SortDirection = "asc" | "desc"

export function CourseTable({ courses, onEditCourse, onDeleteCourse }: CourseTableProps) {
  const [sortField, setSortField] = useState<SortField>("semester")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedCourses = [...courses].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "credits":
        comparison = a.credits - b.credits
        break
      case "semester":
        const [yearA, termA] = [parseInt(a.semester.slice(0, 4)), a.semester.slice(4)]
        const [yearB, termB] = [parseInt(b.semester.slice(0, 4)), b.semester.slice(4)]
        if (yearA !== yearB) {
          comparison = yearA - yearB
        } else {
          comparison = termA === "S" ? -1 : 1
        }
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      case "grade":
        const gradeA = a.grade || "zzz"
        const gradeB = b.grade || "zzz"
        comparison = gradeA.localeCompare(gradeB)
        break
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors group"
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </button>
  )

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">No courses found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="name">Course</SortButton>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                <SortButton field="semester">Semester</SortButton>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="credits">Credits</SortButton>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <SortButton field="status">Status</SortButton>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                <SortButton field="grade">Grade</SortButton>
              </th>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Course actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedCourses.map((course) => (
              <Fragment key={course.id}>
                <tr
                  onClick={() => setExpandedRow(expandedRow === course.id ? null : course.id)}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-foreground/90 line-clamp-2">
                        {course.name}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden mt-0.5">
                        {course.semester}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-foreground font-mono">
                      {course.semester}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-foreground font-medium">
                      {course.credits}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        STATUS_COLORS[course.status]
                      }`}
                    >
                      {course.status === "done" ? "Completed" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {course.grade ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                          GRADE_COLORS[course.grade] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {course.grade}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end">
                      <CourseActionsMenu
                        course={course}
                        onEditCourse={onEditCourse}
                        onDeleteCourse={onDeleteCourse}
                      />
                    </div>
                  </td>
                </tr>
                {expandedRow === course.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="flex flex-wrap gap-6 text-sm">
                        {course.examDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Exam: {course.examDate}</span>
                          </div>
                        )}
                        {course.examiner && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Examiner: {course.examiner}</span>
                          </div>
                        )}
                        <div className="sm:hidden">
                          {course.grade && (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                GRADE_COLORS[course.grade] || "bg-muted text-muted-foreground"
                              }`}
                            >
                              {course.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
