"use client"

import { useEffect, useState } from "react"
import { Course, CourseFormValues, GRADE_OPTIONS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CourseFormDialogProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: CourseFormValues, courseId?: string) => void
}

const defaultValues: CourseFormValues = {
  name: "",
  credits: "",
  semester: "",
  status: "pending",
  grade: "",
  examDate: "",
  examiner: "",
}

function getInitialValues(course: Course | null): CourseFormValues {
  if (!course) {
    return defaultValues
  }

  return {
    name: course.name,
    credits: course.credits.toString(),
    semester: course.semester,
    status: course.status,
    grade: course.grade ?? "",
    examDate: course.examDate ?? "",
    examiner: course.examiner ?? "",
  }
}

export function CourseFormDialog({
  course,
  open,
  onOpenChange,
  onSave,
}: CourseFormDialogProps) {
  const [values, setValues] = useState<CourseFormValues>(defaultValues)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(course))
      setError(null)
    }
  }, [course, open])

  const isEditing = Boolean(course)

  const updateField = <K extends keyof CourseFormValues>(field: K, value: CourseFormValues[K]) => {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "status" && value === "pending" ? { grade: "" } : {}),
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = values.name.trim()
    const trimmedSemester = values.semester.trim().toUpperCase()
    const trimmedCredits = values.credits.trim()

    if (!trimmedName || !trimmedSemester || !trimmedCredits) {
      setError("Name, credits, and semester are required.")
      return
    }

    const credits = Number(trimmedCredits)
    if (Number.isNaN(credits) || credits <= 0) {
      setError("Credits must be a number greater than zero.")
      return
    }

    onSave(
      {
        ...values,
        name: trimmedName,
        semester: trimmedSemester,
        credits: trimmedCredits,
        grade: values.status === "done" ? values.grade : "",
        examDate: values.examDate.trim(),
        examiner: values.examiner.trim(),
      },
      course?.id
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Course" : "Add Course"}</DialogTitle>
          <DialogDescription>
            Update the course details and the dashboard will recalculate everything automatically.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-name">
                Course Name
              </label>
              <Input
                id="course-name"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="363.016 VO Elektrotechnik 2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-credits">
                Credits
              </label>
              <Input
                id="course-credits"
                inputMode="decimal"
                value={values.credits}
                onChange={(event) => updateField("credits", event.target.value)}
                placeholder="4.0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-semester">
                Semester
              </label>
              <Input
                id="course-semester"
                value={values.semester}
                onChange={(event) => updateField("semester", event.target.value)}
                placeholder="2026S"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select
                value={values.status}
                onValueChange={(value) => updateField("status", value as "done" | "pending")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Grade</label>
              <Select
                disabled={values.status !== "done"}
                value={values.grade || "none"}
                onValueChange={(value) => updateField("grade", value === "none" ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No grade</SelectItem>
                  {GRADE_OPTIONS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-exam-date">
                Exam Date
              </label>
              <Input
                id="course-exam-date"
                value={values.examDate}
                onChange={(event) => updateField("examDate", event.target.value)}
                placeholder="19.03.2026"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="course-examiner">
                Examiner
              </label>
              <Input
                id="course-examiner"
                value={values.examiner}
                onChange={(event) => updateField("examiner", event.target.value)}
                placeholder="Thomas Muller"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Course"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
