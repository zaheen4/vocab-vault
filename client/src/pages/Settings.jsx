import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  useChangePassword,
  useDeleteAccount,
  useResetProgress,
  useRevokeAllSessions,
  useUpdateProfile,
} from '../api/queries'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PasswordStrength from '../components/ui/PasswordStrength'

export default function Settings() {
  const { user, updateUser, updateToken, logout } = useAuth()
  const navigate = useNavigate()

  // Profile state
  const [name, setName] = useState(user?.name || '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const updateProfileMutation = useUpdateProfile()

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const changePasswordMutation = useChangePassword()

  // Sessions state
  const [sessionMsg, setSessionMsg] = useState('')
  const revokeSessionsMutation = useRevokeAllSessions()

  // Danger zone state
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [dangerPassword, setDangerPassword] = useState('')
  const [dangerErr, setDangerErr] = useState('')
  const resetProgressMutation = useResetProgress()
  const deleteAccountMutation = useDeleteAccount()

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileMsg('')
    setProfileErr('')
    try {
      const data = await updateProfileMutation.mutateAsync({ name })
      updateUser(data.user)
      setProfileMsg('Display name updated successfully.')
    } catch (err) {
      setProfileErr(err.message)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordErr('')
    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match.')
      return
    }

    try {
      const data = await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
      updateToken(data.token, data.user)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMsg('Password changed successfully. All other sessions have been revoked.')
    } catch (err) {
      setPasswordErr(err.message)
    }
  }

  async function handleRevokeAll() {
    setSessionMsg('')
    try {
      const data = await revokeSessionsMutation.mutateAsync()
      setSessionMsg(data.message || 'All other sessions revoked.')
    } catch (err) {
      setSessionMsg(err.message)
    }
  }

  async function handleResetProgress(e) {
    e.preventDefault()
    setDangerErr('')
    try {
      const data = await resetProgressMutation.mutateAsync({ password: dangerPassword })
      updateUser(data.user)
      setShowResetModal(false)
      setDangerPassword('')
      navigate('/progress')
    } catch (err) {
      setDangerErr(err.message)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()
    setDangerErr('')
    try {
      await deleteAccountMutation.mutateAsync({ password: dangerPassword })
      setShowDeleteModal(false)
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setDangerErr(err.message)
    }
  }

  return (
    <div className="animate-page mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings & Privacy"
        sub="Manage your profile, password, session security, and study data."
      />

      {/* Profile Card */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-primary dark:text-cream-100">
          Profile Details
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-cream-300/70">
          Your public display name visible on study leaderboards and session summaries.
        </p>

        {profileMsg && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            {profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-300">
            {profileErr}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <Input
            label="Display name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email address"
            type="email"
            disabled
            value={user?.email || ''}
            inputClassName="bg-slate-100 text-slate-500 dark:bg-night-950 dark:text-cream-300/50 cursor-not-allowed"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfileMutation.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Password & Security Card */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-primary dark:text-cream-100">
          Password & Security
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-cream-300/70">
          Update your credentials or invalidate sessions across other browsers and devices.
        </p>

        {passwordMsg && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            {passwordMsg}
          </div>
        )}
        {passwordErr && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/50 dark:text-red-300">
            {passwordErr}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <Input
            label="Current password"
            type="password"
            required
            showPasswordToggle
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <div>
            <Input
              label="New password"
              type="password"
              required
              minLength={6}
              maxLength={128}
              showPasswordToggle
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordStrength password={newPassword} />
          </div>

          <Input
            label="Confirm new password"
            type="password"
            required
            minLength={6}
            maxLength={128}
            showPasswordToggle
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRevokeAll}
              loading={revokeSessionsMutation.isPending}
            >
              Log out other devices
            </Button>
            <Button type="submit" loading={changePasswordMutation.isPending}>
              Update password
            </Button>
          </div>
          {sessionMsg && (
            <p className="text-right text-xs text-slate-500 dark:text-cream-300/70">{sessionMsg}</p>
          )}
        </form>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 p-6 dark:border-red-400/30">
        <h2 className="font-display text-lg font-bold text-red-700 dark:text-red-300">
          Danger Zone
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-cream-300/70">
          Irreversible actions on your study data and account records.
        </p>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-cream-100">
                Reset study progress
              </p>
              <p className="text-xs text-slate-500 dark:text-cream-300/70">
                Clears all Leitner SRS boxes and quiz history back to day 1. Your account remains active.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                setDangerErr('')
                setDangerPassword('')
                setShowResetModal(true)
              }}
            >
              Reset progress
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Delete account permanently
              </p>
              <p className="text-xs text-slate-500 dark:text-cream-300/70">
                Permanently deletes your account, bookmarks, custom lists, and study pipeline.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                setDangerErr('')
                setDangerPassword('')
                setShowDeleteModal(true)
              }}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset Progress Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-red-700 dark:text-red-300">
              Confirm Progress Reset
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-cream-300/80">
              Are you sure you want to reset your study progress? All word mastery levels, XP, streaks, and quiz histories will be wiped clean.
            </p>
            {dangerErr && (
              <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-300">
                {dangerErr}
              </p>
            )}
            <form onSubmit={handleResetProgress} className="mt-4 space-y-3">
              <Input
                label="Confirm your password"
                type="password"
                required
                showPasswordToggle
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" loading={resetProgressMutation.isPending}>
                  Confirm reset
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-red-700 dark:text-red-300">
              Delete Account Permanently
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-cream-300/80">
              This action cannot be undone. All your vocabulary records, bookmarks, custom lists, and profile data will be erased immediately.
            </p>
            {dangerErr && (
              <p className="mt-3 rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/50 dark:text-red-300">
                {dangerErr}
              </p>
            )}
            <form onSubmit={handleDeleteAccount} className="mt-4 space-y-3">
              <Input
                label="Confirm your password"
                type="password"
                required
                showPasswordToggle
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" loading={deleteAccountMutation.isPending}>
                  Delete forever
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
