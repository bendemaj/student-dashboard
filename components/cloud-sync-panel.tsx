"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const EMAIL_OTP_LENGTH = 8

interface CloudSyncPanelProps {
  cloudSyncEnabled: boolean
  isLoading: boolean
  userEmail: string | null
  onSignIn: (email: string) => Promise<void>
  onVerifyCode: (email: string, code: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function CloudSyncPanel({
  cloudSyncEnabled,
  isLoading,
  userEmail,
  onSignIn,
  onVerifyCode,
  onSignOut,
}: CloudSyncPanelProps) {
  const [email, setEmail] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestCode = async (nextEmail: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await onSignIn(nextEmail)
      setPendingEmail(nextEmail)
      setOtpCode("")
      setEmail("")
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not start sign-in."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError("Enter your email address to receive a sign-in code.")
      return
    }

    await requestCode(trimmedEmail)
  }

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (otpCode.length !== EMAIL_OTP_LENGTH) {
      setError(`Enter the ${EMAIL_OTP_LENGTH}-digit code from your email.`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onVerifyCode(pendingEmail, otpCode)
      setPendingEmail("")
      setOtpCode("")
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not verify the sign-in code."
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
      {pendingEmail ? (
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleVerify}>
          <div className="space-y-1">
            <p className="text-sm text-foreground">Enter the {EMAIL_OTP_LENGTH}-digit code sent to {pendingEmail}.</p>
            <button
              type="button"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              onClick={() => {
                setPendingEmail("")
                setOtpCode("")
                setError(null)
                setEmail(pendingEmail)
              }}
            >
              Use a different email
            </button>
          </div>
          <InputOTP
            maxLength={EMAIL_OTP_LENGTH}
            value={otpCode}
            onChange={setOtpCode}
            disabled={isLoading || isSubmitting}
            containerClassName="justify-start"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
          </InputOTP>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={isLoading || isSubmitting || otpCode.length !== EMAIL_OTP_LENGTH}>
              {isSubmitting ? "Verifying..." : "Verify code"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || isSubmitting}
              onClick={() => void requestCode(pendingEmail)}
            >
              Resend code
            </Button>
          </div>
        </form>
      ) : (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            disabled={isLoading || isSubmitting}
          />
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {isSubmitting ? "Sending code..." : "Email me a sign-in code"}
          </Button>
        </form>
      )}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
