import type { SupabaseClient } from "@supabase/supabase-js"
import { Course } from "@/lib/types"

interface CourseRow {
  id: string
  user_id: string
  name: string
  credits: number
  semester: string
  status: Course["status"]
  grade: string | null
  exam_date: string | null
  examiner: string | null
  created_at?: string
  updated_at?: string
}

const COURSE_COLUMNS = "id, user_id, name, credits, semester, status, grade, exam_date, examiner, created_at, updated_at"

function fromCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    credits: Number(row.credits),
    semester: row.semester,
    status: row.status,
    grade: row.grade,
    examDate: row.exam_date,
    examiner: row.examiner,
  }
}

function toCourseRow(course: Course, userId: string): CourseRow {
  return {
    id: course.id,
    user_id: userId,
    name: course.name,
    credits: course.credits,
    semester: course.semester,
    status: course.status,
    grade: course.grade,
    exam_date: course.examDate,
    examiner: course.examiner,
  }
}

export async function listCourses(client: SupabaseClient) {
  const { data, error } = await client
    .from("courses")
    .select(COURSE_COLUMNS)
    .order("semester", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => fromCourseRow(row as CourseRow))
}

export async function saveCourse(client: SupabaseClient, userId: string, course: Course) {
  const { data, error } = await client
    .from("courses")
    .upsert(toCourseRow(course, userId), { onConflict: "id" })
    .select(COURSE_COLUMNS)
    .single()

  if (error) {
    throw error
  }

  return fromCourseRow(data as CourseRow)
}

export async function deleteCourse(client: SupabaseClient, courseId: string) {
  const { error } = await client
    .from("courses")
    .delete()
    .eq("id", courseId)

  if (error) {
    throw error
  }
}

export async function clearCourses(client: SupabaseClient) {
  const { data: existingRows, error: existingError } = await client
    .from("courses")
    .select("id")

  if (existingError) {
    throw existingError
  }

  const idsToDelete = (existingRows ?? []).map((row) => row.id as string)
  if (idsToDelete.length === 0) {
    return
  }

  const { error } = await client
    .from("courses")
    .delete()
    .in("id", idsToDelete)

  if (error) {
    throw error
  }
}

export async function replaceCourses(
  client: SupabaseClient,
  userId: string,
  courses: Course[]
) {
  const { data: existingRows, error: existingError } = await client
    .from("courses")
    .select("id")

  if (existingError) {
    throw existingError
  }

  if (courses.length > 0) {
    const rows = courses.map((course) => toCourseRow(course, userId))
    const { error: upsertError } = await client
      .from("courses")
      .upsert(rows, { onConflict: "id" })

    if (upsertError) {
      throw upsertError
    }
  }

  const idsToKeep = new Set(courses.map((course) => course.id))
  const idsToDelete = (existingRows ?? [])
    .map((row) => row.id as string)
    .filter((id) => !idsToKeep.has(id))

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await client
      .from("courses")
      .delete()
      .in("id", idsToDelete)

    if (deleteError) {
      throw deleteError
    }
  }

  return courses
}
