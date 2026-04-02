"use client"

import { Search, Filter, X } from "lucide-react"

interface FiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedSemester: string
  setSelectedSemester: (semester: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  semesters: string[]
}

export function Filters({
  searchQuery,
  setSearchQuery,
  selectedSemester,
  setSelectedSemester,
  selectedStatus,
  setSelectedStatus,
  semesters,
}: FiltersProps) {
  const hasFilters = searchQuery || selectedSemester !== "all" || selectedStatus !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSemester("all")
    setSelectedStatus("all")
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-shadow"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-shadow cursor-pointer"
        >
          <option value="all">All Semesters</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-shadow cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="done">Completed</option>
          <option value="pending">Pending</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
