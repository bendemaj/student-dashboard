"use client"

import { useEffect, useMemo, useState } from "react"
import { courses as initialCourses, getStats, getSemesters } from "@/lib/courses"
import { Course, CourseFormValues } from "@/lib/types"
import { StatsCards } from "./stats-cards"
import { Filters } from "./filters"
import { CourseTable } from "./course-table"
import { SemesterOverview } from "./semester-overview"
import { CourseFormDialog } from "./course-form-dialog"
import { CourseActionsMenu } from "./course-actions-menu"
import { Button } from "@/components/ui/button"
import { GraduationCap, LayoutGrid, List, Plus } from "lucide-react"
import { CourseImportResult } from "@/lib/import-courses"
import { toast } from "@/hooks/use-toast"
import { CloudSyncPanel } from "./cloud-sync-panel"
import { clearCourses, deleteCourse, listCourses, replaceCourses, saveCourse } from "@/lib/supabase/courses"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

const STORAGE_KEY = "student-dashboard-courses"
const CURRENT_SEMESTER_KEY = "student-dashboard-current-semester"
const DEFAULT_CURRENT_SEMESTER = "2026S"
const CLOUD_SYNC_ENABLED = isSupabaseConfigured()

export function Dashboard() {
  const [courseList, setCourseList] = useState<Course[]>(CLOUD_SYNC_ENABLED ? [] : initialCourses)
  const [hasLoadedCourses, setHasLoadedCourses] = useState(!CLOUD_SYNC_ENABLED)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [currentSemester, setCurrentSemester] = useState(DEFAULT_CURRENT_SEMESTER)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!CLOUD_SYNC_ENABLED)
  const [isSyncing, setIsSyncing] = useState(false)

  const supabase = useMemo(() => {
    if (!CLOUD_SYNC_ENABLED) {
      return null
    }

    return getSupabaseBrowserClient()
  }, [])

  useEffect(() => {
    const storedCurrentSemester = window.localStorage.getItem(CURRENT_SEMESTER_KEY)
    if (storedCurrentSemester) {
      setCurrentSemester(storedCurrentSemester)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(CURRENT_SEMESTER_KEY, currentSemester)
  }, [currentSemester])

  useEffect(() => {
    if (CLOUD_SYNC_ENABLED) {
      return
    }

    const storedCourses = window.localStorage.getItem(STORAGE_KEY)

    if (!storedCourses) {
      setHasLoadedCourses(true)
      return
    }

    try {
      const parsedCourses = JSON.parse(storedCourses) as Course[]
      if (Array.isArray(parsedCourses)) {
        setCourseList(parsedCourses)
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHasLoadedCourses(true)
    }
  }, [])

  useEffect(() => {
    if (CLOUD_SYNC_ENABLED || !hasLoadedCourses) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courseList))
  }, [courseList, hasLoadedCourses])

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isActive = true

    const handleSession = async (nextSession: Session | null) => {
      if (!isActive) {
        return
      }

      setSession(nextSession)

      if (!nextSession) {
        setCourseList([])
        setHasLoadedCourses(true)
        setAuthReady(true)
        return
      }

      setAuthReady(true)
      setHasLoadedCourses(false)
      setIsSyncing(true)

      try {
        let remoteCourses = await listCourses(supabase)

        if (remoteCourses.length === 0) {
          const localCourses = readLegacyLocalCourses()
          if (localCourses.length > 0) {
            await replaceCourses(supabase, nextSession.user.id, localCourses)
            remoteCourses = localCourses
            toast({
              title: "Local data moved to cloud sync",
              description: `${localCourses.length} courses were uploaded for this account.`,
            })
          }
        }

        if (!isActive) {
          return
        }

        setCourseList(remoteCourses)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load courses from Supabase."
        toast({
          title: "Cloud sync failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        if (isActive) {
          setHasLoadedCourses(true)
          setIsSyncing(false)
        }
      }
    }

    void supabase.auth.getSession()
      .then(({ data }) => {
        void handleSession(data.session)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not restore the Supabase session."
        toast({
          title: "Cloud sync failed",
          description: message,
          variant: "destructive",
        })
        setAuthReady(true)
        setHasLoadedCourses(true)
        setIsSyncing(false)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession)
    })

    return () => {
      isActive = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (selectedSemester !== "all" && !courseList.some((course) => course.semester === selectedSemester)) {
      setSelectedSemester("all")
    }
  }, [courseList, selectedSemester])

  const semesters = useMemo(() => getSemesters(courseList), [courseList])

  useEffect(() => {
    if (semesters.length === 0) {
      return
    }

    if (currentSemester !== "all" && !semesters.includes(currentSemester)) {
      const fallbackSemester = semesters.includes(DEFAULT_CURRENT_SEMESTER)
        ? DEFAULT_CURRENT_SEMESTER
        : semesters[semesters.length - 1]
      setCurrentSemester(fallbackSemester)
    }
  }, [currentSemester, semesters])

  const filteredCourses = useMemo(() => {
    return courseList.filter((course) => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.examiner?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesSemester = selectedSemester === "all" || course.semester === selectedSemester
      const matchesStatus = selectedStatus === "all" || course.status === selectedStatus
      return matchesSearch && matchesSemester && matchesStatus
    })
  }, [courseList, searchQuery, selectedSemester, selectedStatus])

  const allStats = useMemo(() => getStats(courseList), [courseList])

  const openAddDialog = () => {
    setEditingCourse(null)
    setIsDialogOpen(true)
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setIsDialogOpen(true)
  }

  const handleDeleteCourse = (courseId: string) => {
    void (async () => {
      const courseToDelete = courseList.find((course) => course.id === courseId)
      if (!courseToDelete) {
        return
      }

      const confirmed = window.confirm(`Delete "${courseToDelete.name}" from the dashboard?`)
      if (!confirmed) {
        return
      }

      if (!supabase || !session) {
        setCourseList((current) => current.filter((course) => course.id !== courseId))
        return
      }

      setIsSyncing(true)

      try {
        await deleteCourse(supabase, courseId)
        setCourseList((current) => current.filter((course) => course.id !== courseId))
      } catch (error) {
        const message = error instanceof Error ? error.message : "The course could not be deleted."
        toast({
          title: "Delete failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    })()
  }

  const handleSaveCourse = (values: CourseFormValues, courseId?: string) => {
    void (async () => {
      const nextCourse: Course = {
        id: courseId ?? crypto.randomUUID(),
        name: values.name,
        credits: Number(values.credits),
        semester: values.semester,
        status: values.status,
        grade: values.status === "done" && values.grade ? values.grade : null,
        examDate: values.examDate || null,
        examiner: values.examiner || null,
      }

      if (!supabase || !session) {
        setCourseList((current) => {
          if (!courseId) {
            return [...current, nextCourse]
          }

          return current.map((course) => (course.id === courseId ? nextCourse : course))
        })

        setIsDialogOpen(false)
        setEditingCourse(null)
        return
      }

      setIsSyncing(true)

      try {
        const savedCourse = await saveCourse(supabase, session.user.id, nextCourse)

        setCourseList((current) => {
          if (!courseId) {
            return [...current, savedCourse]
          }

          return current.map((course) => (course.id === courseId ? savedCourse : course))
        })

        setIsDialogOpen(false)
        setEditingCourse(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : "The course could not be saved."
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsSyncing(false)
      }
    })()
  }

  const handleImportComplete = ({ courses, skippedRows, fileName }: CourseImportResult) => {
    void (async () => {
      if (supabase && session) {
        setIsSyncing(true)

        try {
          await replaceCourses(supabase, session.user.id, courses)
        } catch (error) {
          const message = error instanceof Error ? error.message : "The imported courses could not be saved."
          toast({
            title: "Import failed",
            description: message,
            variant: "destructive",
          })
          setIsSyncing(false)
          return
        }

        setIsSyncing(false)
      }

      setCourseList(courses)
      setSelectedSemester("all")
      setSelectedStatus("all")
      setSearchQuery("")

      const description = skippedRows > 0
        ? `${courses.length} courses imported from ${fileName}. ${skippedRows} row${skippedRows === 1 ? "" : "s"} skipped.`
        : `${courses.length} courses imported from ${fileName}.`

      toast({
        title: "Import complete",
        description,
      })
    })()
  }

  const handleImportError = (message: string) => {
    toast({
      title: "Import failed",
      description: message,
      variant: "destructive",
    })
  }

  const handleClearAllCourses = () => {
    void (async () => {
      if (supabase && session) {
        setIsSyncing(true)

        try {
          await clearCourses(supabase)
        } catch (error) {
          const message = error instanceof Error ? error.message : "The dashboard could not be cleared."
          toast({
            title: "Clear failed",
            description: message,
            variant: "destructive",
          })
          setIsSyncing(false)
          return
        }

        setIsSyncing(false)
      }

      setCourseList([])
      setSelectedSemester("all")
      setSelectedStatus("all")
      setSearchQuery("")
      setCurrentSemester("all")

      toast({
        title: "Table cleared",
        description: "All courses were removed from the dashboard.",
      })
    })()
  }

  const handleSignIn = async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.")
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      throw error
    }

    toast({
      title: "Check your inbox",
      description: `A sign-in link was sent to ${email}.`,
    })
  }

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }

    setIsSyncing(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      toast({
        title: "Signed out",
        description: "Cloud sync has been disconnected for this browser.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign out."
      toast({
        title: "Sign-out failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const showCloudGate = CLOUD_SYNC_ENABLED && authReady && !session
  const showLoadingState = CLOUD_SYNC_ENABLED && (!authReady || !hasLoadedCourses)

  if (showLoadingState) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full rounded-xl border border-border bg-card p-8">
            <p className="text-sm font-medium text-foreground">Connecting to cloud sync...</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The app is restoring your session and loading your course table.
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (showCloudGate) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <CloudSyncPanel
            cloudSyncEnabled={CLOUD_SYNC_ENABLED}
            isLoading={isSyncing}
            userEmail={null}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        </main>
      </div>
    )
  }

  const currentUserEmail = session?.user.email ?? null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
                <GraduationCap className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Student Dashboard</h1>
                <p className="text-xs text-muted-foreground">TU Wien - Electrical Engineering</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <CloudSyncPanel
            cloudSyncEnabled={CLOUD_SYNC_ENABLED}
            isLoading={isSyncing}
            userEmail={currentUserEmail}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />

          {/* Stats Cards */}
          <StatsCards stats={allStats} />

          {/* Combined Progress Overview */}
          <div>
            <SemesterOverview
              courses={courseList}
              semesters={semesters}
              currentSemester={currentSemester}
              onCurrentSemesterChange={setCurrentSemester}
            />
          </div>

          {/* Courses Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">All Courses</h2>
              <div className="flex flex-col gap-3 sm:items-end">
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
                <Filters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedSemester={selectedSemester}
                  setSelectedSemester={setSelectedSemester}
                  selectedStatus={selectedStatus}
                  setSelectedStatus={setSelectedStatus}
                  semesters={semesters}
                />
              </div>
            </div>

            {viewMode === "table" ? (
              <CourseTable
                courses={filteredCourses}
                totalCoursesCount={courseList.length}
                onEditCourse={handleEditCourse}
                onDeleteCourse={handleDeleteCourse}
                onImportComplete={handleImportComplete}
                onImportError={handleImportError}
                onClearAll={handleClearAllCourses}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-border bg-card p-4 hover:border-border/80 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">
                        {course.name}
                      </h3>
                      <div className="flex items-start gap-1">
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            course.status === "done"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {course.status === "done" ? "Done" : "Pending"}
                        </span>
                        <CourseActionsMenu
                          course={course}
                          onEditCourse={handleEditCourse}
                          onDeleteCourse={handleDeleteCourse}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono">{course.semester}</span>
                      <span>{course.credits} ECTS</span>
                      {course.grade && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {course.grade}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground pt-2">
              Showing {filteredCourses.length} of {courseList.length} courses
            </div>
          </div>
        </div>
      </main>

      <CourseFormDialog
        course={editingCourse}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingCourse(null)
          }
        }}
        onSave={handleSaveCourse}
      />
    </div>
  )
}

function readLegacyLocalCourses() {
  const storedCourses = window.localStorage.getItem(STORAGE_KEY)
  if (!storedCourses) {
    return []
  }

  try {
    const parsedCourses = JSON.parse(storedCourses) as Course[]
    return Array.isArray(parsedCourses) ? parsedCourses : []
  } catch {
    return []
  }
}
