import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { queryClient } from './api/queryClient'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DeckLayout from './components/DeckLayout'
import Home from './pages/Home'
import Progress from './pages/Progress'
import Search from './pages/Search'
import Bookmarks from './pages/Bookmarks'
import SavedPractice from './pages/SavedPractice'
import AddWord from './pages/AddWord'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import About from './pages/About'

// Authenticated users never need the auth forms: send them home instead of
// letting a re-submit silently overwrite the active session.
function GuestRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen supports-[height:100dvh]:min-h-dvh items-center justify-center text-slate-500 dark:text-cream-300/70">
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
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="decks/:id/*" element={<DeckLayout />} />
            <Route path="progress" element={<Progress />} />
            <Route path="search" element={<Search />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="bookmarks/practice" element={<SavedPractice />} />
            <Route path="words/new" element={<AddWord />} />
            <Route path="about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
