"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CloudSyncPanelProps {
  cloudSyncEnabled: boolean
  isLoading: boolean
  userEmail: string | null
  onSignIn: (email: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function CloudSyncPanel({
  cloudSyncEnabled,
  isLoading,
  userEmail,
  onSignIn,
  onSignOut,
}: CloudSyncPanelProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Enter your email address to receive a magic sign-in link.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSignIn(trimmedEmail)
      setEmail("")
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not start sign-in."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!cloudSyncEnabled) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-medium text-foreground">Cloud sync is not configured yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable phone-to-laptop sync.
        </p>
      </div>
    )
  }

  if (userEmail) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Cloud sync is active.</p>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
        <Button variant="outline" onClick={() => void onSignOut()} disabled={isLoading || isSubmitting}>
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-foreground">Sign in to sync your course table.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the same email on your laptop and phone to share one course database.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={isLoading || isSubmitting}
        />
        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isSubmitting ? "Sending link..." : "Email me a sign-in link"}
        </Button>
      </form>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
