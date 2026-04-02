"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Course } from "@/lib/types"
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react"

interface CourseActionsMenuProps {
  course: Course
  onEditCourse: (course: Course) => void
  onDeleteCourse: (courseId: string) => void
}

export function CourseActionsMenu({
  course,
  onEditCourse,
  onDeleteCourse,
}: CourseActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="opacity-70 hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <EllipsisVertical className="h-4 w-4" />
          <span className="sr-only">Open actions for {course.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(event) => {
            event.stopPropagation()
            onEditCourse(course)
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={(event) => {
            event.stopPropagation()
            onDeleteCourse(course.id)
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
