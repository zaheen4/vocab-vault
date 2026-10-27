import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { queryClient } from './api/queryClient'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Mascot from './components/art/Mascot'

const Home = lazy(() => import('./pages/Home'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Progress = lazy(() => import('./pages/Progress'))
const History = lazy(() => import('./pages/History'))
const Search = lazy(() => import('./pages/Search'))
const Bookmarks = lazy(() => import('./pages/Bookmarks'))
const SavedPractice = lazy(() => import('./pages/SavedPractice'))
const DuePractice = lazy(() => import('./pages/DuePractice'))
const WeakPractice = lazy(() => import('./pages/WeakPractice'))
const AddWord = lazy(() => import('./pages/AddWord'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))
const About = lazy(() => import('./pages/About'))
const DeckLayout = lazy(() => import('./components/DeckLayout'))

function PageFallback() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400 dark:text-cream-300/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-accent dark:border-night-800 dark:border-t-accent" />
      <span className="text-xs font-semibold">Loading...</span>
    </div>
  )
}

// Authenticated users never need the auth forms: send them home instead of
// letting a re-submit silently overwrite the active session.
function GuestRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500 dark:text-cream-300/70">
        <span className="animate-pop" aria-hidden="true">
          <Mascot size={56} />
        </span>
        Loading…
      </div>
    )
  }
  if (token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
              <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="quiz" element={<div className="mx-auto max-w-xl space-y-4"><Quiz deckId="all" /></div>} />
                <Route path="decks/all/quiz" element={<Navigate to="/quiz" replace />} />
                <Route path="decks/all" element={<Navigate to="/quiz" replace />} />
                <Route path="decks/:id/*" element={<DeckLayout />} />
                <Route path="practice/due" element={<DuePractice />} />
                <Route path="practice/weak" element={<WeakPractice />} />
                <Route path="progress" element={<Progress />} />
                <Route path="history" element={<History />} />
                <Route path="settings" element={<Settings />} />
                <Route path="search" element={<Search />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="bookmarks/practice" element={<SavedPractice />} />
                <Route path="words/new" element={<AddWord />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
