export interface Course {
  id: string
  name: string
  credits: number
  semester: string
  status: "done" | "pending"
  grade: string | null
  examDate: string | null
  examiner: string | null
}

export interface CourseFormValues {
  name: string
  credits: string
  semester: string
  status: "done" | "pending"
  grade: string
  examDate: string
  examiner: string
}

export interface Stats {
  totalCredits: number
  completedCredits: number
  pendingCredits: number
  completedCourses: number
  pendingCourses: number
  averageGrade: number | null
}

export const GRADE_MAP: Record<string, number> = {
  "sehr gut": 1,
  "gut": 2,
  "befriedigend": 3,
  "genügend": 4,
}

export const GRADE_OPTIONS = [
  "sehr gut",
  "gut",
  "befriedigend",
  "genügend",
  "mit Erfolg teilgenommen",
] as const

export const GRADE_COLORS: Record<string, string> = {
  "sehr gut": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "gut": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "befriedigend": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "genügend": "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  "mit Erfolg teilgenommen": "bg-slate-500/15 text-slate-600 dark:text-slate-400",
}

export const STATUS_COLORS: Record<string, string> = {
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
}
