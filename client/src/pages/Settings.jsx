import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  useChangePassword,
  useDeleteAccount,
  useGamification,
  useResetProgress,
  useRevokeAllSessions,
  useSetGoalTarget,
  useUpdateProfile,
} from '../api/queries'
import PageHeader from '../components/PageHeader'
import Sheet from '../components/Sheet'
import GoalPicker from '../components/GoalPicker'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'
import OptionTile from '../components/ui/OptionTile'
import PasswordStrength from '../components/ui/PasswordStrength'

const THEME_OPTIONS = [
  {
    value: 'system',
    label: 'System',
    hint: 'Follow device',
    swatch: 'bg-gradient-to-r from-card to-night-900',
  },
  { value: 'light', label: 'Light', hint: 'Linen desk', swatch: 'bg-card' },
  { value: 'dark', label: 'Dark', hint: 'Late study', swatch: 'bg-night-900' },
]

export default function Settings() {
  const { user, updateUser, updateToken, logout } = useAuth()
  const { preference: themePreference, setTheme } = useTheme()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const updateProfileMutation = useUpdateProfile()

  const { data: stats } = useGamification()
  const setGoal = useSetGoalTarget()
  const target = stats?.dailyGoalTarget || 10
  const reviewsToday = stats?.reviewsToday || 0

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const changePasswordMutation = useChangePassword()

  const [sessionMsg, setSessionMsg] = useState('')
  const revokeSessionsMutation = useRevokeAllSessions()

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

      <Sheet tab="Profile" title="Profile details">
        <p className="text-xs text-ink-muted">
          Your public display name visible on study leaderboards and session summaries.
        </p>

        {profileMsg && (
          <Notice tone="success" className="mt-4 text-xs font-semibold">
            {profileMsg}
          </Notice>
        )}
        {profileErr && (
          <Notice tone="error" className="mt-4 text-xs font-semibold">
            {profileErr}
          </Notice>
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
            readOnly
            value={user?.email || ''}
            inputClassName="bg-raised text-ink-muted cursor-not-allowed"
          />

          <div className="flex justify-end">
            <Button type="submit" loading={updateProfileMutation.isPending}>
              Save profile
            </Button>
          </div>
        </form>
      </Sheet>

      <Sheet tab="Appearance" title="Appearance & theme">
        <p className="text-xs text-ink-muted">
          Choose how VocabVault looks. System follows your device setting.
        </p>

        <div
          role="group"
          aria-label="Theme preference"
          className="mt-4 grid grid-cols-3 gap-2"
        >
          {THEME_OPTIONS.map((option) => (
            <OptionTile
              key={option.value}
              pressed={themePreference === option.value}
              onClick={() => setTheme(option.value)}
              swatch={option.swatch}
              label={option.label}
              hint={option.hint}
            />
          ))}
        </div>
      </Sheet>

      <Sheet tab="Study" title="Study & audio">
        <div className="space-y-4">
          {setGoal.error && (
            <Notice tone="error" className="text-xs font-semibold">
              {setGoal.error.message}
            </Notice>
          )}

          <div>
            <p className="text-sm font-semibold text-ink">Daily review goal</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {reviewsToday} of {target} reviews today
            </p>
            <div className="mt-3">
              <GoalPicker
                className="grid grid-cols-4 gap-1.5 sm:grid-cols-8"
                target={target}
                onChange={setGoal.mutate}
                busy={setGoal.isPending}
              />
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <p className="text-sm font-semibold text-ink">Audio pronunciation</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Pronunciation plays a pre-rendered clip; if your device has no voices, the speaker is disabled.
            </p>
          </div>
        </div>
      </Sheet>

      <Sheet tab="Security" title="Password & security">
        <p className="text-xs text-ink-muted">
          Update your credentials or invalidate sessions across other browsers and devices.
        </p>

        {passwordMsg && (
          <Notice tone="success" className="mt-4 text-xs font-semibold">
            {passwordMsg}
          </Notice>
        )}
        {passwordErr && (
          <Notice tone="error" className="mt-4 text-xs font-semibold">
            {passwordErr}
          </Notice>
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

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={changePasswordMutation.isPending}>
              Update password
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Revoke sessions
              </p>
              <p className="text-xs text-ink-muted">
                Invalidate all active sessions across other browsers and devices.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRevokeAll}
              loading={revokeSessionsMutation.isPending}
            >
              Log out other devices
            </Button>
          </div>
          {sessionMsg && (
            <Notice tone="info" className="mt-3 text-xs font-semibold">
              {sessionMsg}
            </Notice>
          )}
        </div>
      </Sheet>

      <Sheet tab="Danger zone" className="border-stamp/30 bg-stamp-wash">
        <div className="mb-4 border-b border-stamp/20 pb-3">
          <h2 className="font-display text-base font-bold text-stamp">Danger zone</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Irreversible actions on your study data and account records.
          </p>
        </div>

        <div className="divide-y divide-stamp/15">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Reset study progress
              </p>
              <p className="text-xs text-ink-muted">
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
              <p className="text-sm font-semibold text-stamp">
                Delete account permanently
              </p>
              <p className="text-xs text-ink-muted">
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
      </Sheet>

      <AnimatePresence>
        {showResetModal && (
          <Dialog
            labelledBy="danger-reset-title"
            onClose={() => setShowResetModal(false)}
          >
            <h3 id="danger-reset-title" className="font-display text-lg font-bold text-stamp">
              Confirm Progress Reset
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              Are you sure you want to reset your study progress? All word mastery levels, XP, streaks, and quiz histories will be wiped clean.
            </p>
            {dangerErr && (
              <Notice tone="error" className="mt-3">
                {dangerErr}
              </Notice>
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
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <Dialog
            labelledBy="danger-delete-title"
            onClose={() => setShowDeleteModal(false)}
          >
            <h3 id="danger-delete-title" className="font-display text-lg font-bold text-stamp">
              Delete Account Permanently
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              This action cannot be undone. All your vocabulary records, bookmarks, custom lists, and profile data will be erased immediately.
            </p>
            {dangerErr && (
              <Notice tone="error" className="mt-3">
                {dangerErr}
              </Notice>
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
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
